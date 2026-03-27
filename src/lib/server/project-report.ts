import "server-only";

import { isProjectCurrent } from "@/lib/project-status";
import {
  formatWeekRangeLabel,
  normalizeWeekStart,
  startOfCurrentWeek,
  toIsoDate,
} from "@/lib/server/date-utils";
import {
  listProjectAiReportsByProjectIds,
  listProjects,
} from "@/lib/server/repositories/projects";
import { listStudents } from "@/lib/server/repositories/students";

export interface ProjectReportItem {
  studentId: string;
  studentName: string;
  projectName: string;
  projectUrl: string;
  progress: number | null;
  progressDelta: number | null;
  lastUpdateDaysAgo: number | null;
  updateLabel: string;
}

export interface ProjectReportRow {
  studentId: string;
  studentName: string;
  projectName: string | null;
  projectUrl: string | null;
  progress: number | null;
  progressDelta: number | null;
  updateLabel: string;
  weeklyStatus: "success" | "warning" | "critical" | "unmarked";
  hasProject: boolean;
}

export interface ProjectReportData {
  weekStart: string;
  weekRangeLabel: string;
  totalStudents: number;
  registeredProjects: number;
  rows: ProjectReportRow[];
  goodDynamics: ProjectReportItem[];
  noDynamics: ProjectReportItem[];
  abandoned: ProjectReportItem[];
  missingProjectData: string[];
}

function formatLastUpdateLabel(lastUpdateDaysAgo: number | null) {
  if (lastUpdateDaysAgo === null) {
    return "нет данных по обновлениям";
  }

  if (lastUpdateDaysAgo < 1) {
    return "сегодня";
  }

  if (lastUpdateDaysAgo === 1) {
    return "1 дн. назад";
  }

  return `${lastUpdateDaysAgo} дн. назад`;
}

function formatStudentName(lastName: string, firstName: string) {
  return `${lastName} ${firstName}`;
}

function compareStudentNames(a: string, b: string) {
  return a.localeCompare(b, "ru");
}

function resolveWeeklyStatus(input: {
  hasProject: boolean;
  isAbandoned: boolean;
  progressDelta: number | null;
}) {
  if (!input.hasProject) {
    return "unmarked" as const;
  }

  if (input.isAbandoned) {
    return "critical" as const;
  }

  if (input.progressDelta !== null && input.progressDelta >= 10) {
    return "success" as const;
  }

  if (input.progressDelta === 0) {
    return "warning" as const;
  }

  return "unmarked" as const;
}

export async function buildProjectReportData(
  inputWeekStart?: string,
): Promise<ProjectReportData> {
  const weekStart =
    normalizeWeekStart(inputWeekStart) || toIsoDate(startOfCurrentWeek());
  const weekStartDate = new Date(`${weekStart}T00:00:00.000Z`);
  const weekRangeLabel = formatWeekRangeLabel(weekStart);
  const [students, allProjects] = await Promise.all([
    listStudents(),
    listProjects(),
  ]);
  const projects = allProjects.filter((project) =>
    isProjectCurrent(project.status),
  );
  const reportsByProjectId = await listProjectAiReportsByProjectIds(
    projects.map((project) => project.id),
  );

  const items = projects.flatMap((project) => {
    const reports = reportsByProjectId.get(project.id) ?? [];
    const latestReport = reports[0] ?? null;
    const previousReport =
      reports.find(
        (report) =>
          new Date(report.createdAt).getTime() < weekStartDate.getTime(),
      ) ??
      reports.find((report) => report.id !== latestReport?.id) ??
      null;
    const progressDelta =
      latestReport && previousReport
        ? latestReport.completionPercent - previousReport.completionPercent
        : null;

    return project.memberStudentIds.map((studentId, index) => ({
      studentId,
      studentName: project.memberNames[index] ?? project.ownerStudentName,
      projectName: project.name,
      projectUrl: project.githubUrl,
      progress: project.hasAiAnalysisSnapshot ? project.progress : null,
      progressDelta,
      lastUpdateDaysAgo: project.lastCommitDaysAgo,
      updateLabel: formatLastUpdateLabel(project.lastCommitDaysAgo),
      isGoodDynamics:
        project.hasAiAnalysisSnapshot &&
        project.risk === "healthy" &&
        project.lastCommitDaysAgo !== null &&
        project.lastCommitDaysAgo <= 7 &&
        progressDelta !== null &&
        progressDelta >= 10,
      isNoDynamics:
        project.hasAiAnalysisSnapshot &&
        project.lastCommitDaysAgo !== null &&
        project.lastCommitDaysAgo <= 7 &&
        progressDelta === 0,
      isAbandoned:
        project.risk === "abandoned" ||
        project.isAbandoned ||
        (project.lastCommitDaysAgo !== null && project.lastCommitDaysAgo > 7),
    })) satisfies (ProjectReportItem & {
      isGoodDynamics: boolean;
      isNoDynamics: boolean;
      isAbandoned: boolean;
    })[];
  });

  const studentIdsWithProjects = new Set(
    projects.flatMap((project) => project.memberStudentIds),
  );
  const missingProjectData = students
    .filter((student) => !studentIdsWithProjects.has(student.id))
    .map((student) => formatStudentName(student.lastName, student.firstName))
    .sort(compareStudentNames);

  const projectByStudentId = new Map(
    items.map((item) => [item.studentId, item] as const),
  );
  const rows = students
    .map((student) => {
      const project = projectByStudentId.get(student.id);

      return {
        studentId: student.id,
        studentName: formatStudentName(student.lastName, student.firstName),
        projectName: project?.projectName ?? null,
        projectUrl: project?.projectUrl ?? null,
        progress: project?.progress ?? null,
        progressDelta: project?.progressDelta ?? null,
        updateLabel: project?.updateLabel ?? "данных нет",
        weeklyStatus: resolveWeeklyStatus({
          hasProject: Boolean(project),
          isAbandoned: project?.isAbandoned ?? false,
          progressDelta: project?.progressDelta ?? null,
        }),
        hasProject: Boolean(project),
      } satisfies ProjectReportRow;
    })
    .sort((a, b) => compareStudentNames(a.studentName, b.studentName));

  return {
    weekStart,
    weekRangeLabel,
    totalStudents: students.length,
    registeredProjects: projects.length,
    rows,
    goodDynamics: items
      .filter((item) => item.isGoodDynamics)
      .sort((a, b) => compareStudentNames(a.studentName, b.studentName)),
    noDynamics: items
      .filter((item) => item.isNoDynamics && !item.isAbandoned)
      .sort((a, b) => compareStudentNames(a.studentName, b.studentName)),
    abandoned: items
      .filter((item) => item.isAbandoned)
      .sort((a, b) => compareStudentNames(a.studentName, b.studentName)),
    missingProjectData,
  };
}
