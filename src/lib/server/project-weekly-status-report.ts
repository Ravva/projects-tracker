import "server-only";

import { getProjectRiskLabel } from "@/lib/project-risk";
import { isProjectCurrent } from "@/lib/project-status";
import {
  formatWeekRangeLabel,
  startOfCurrentWeek,
  toIsoDate,
} from "@/lib/server/date-utils";
import {
  listProjectAiReportsByProjectIds,
  listProjects,
} from "@/lib/server/repositories/projects";

function formatLastCommitLabel(lastCommitDaysAgo: number | null) {
  if (lastCommitDaysAgo === null) {
    return "нет данных по коммитам";
  }

  if (lastCommitDaysAgo < 1) {
    return "коммит сегодня";
  }

  if (lastCommitDaysAgo === 1) {
    return "коммит 1 дн. назад";
  }

  return `коммит ${lastCommitDaysAgo} дн. назад`;
}

function buildProgressDeltaLabel(delta: number | null) {
  if (delta === null) {
    return "нет weekly-базы для сравнения";
  }

  if (delta <= 0) {
    return "без роста прогресса";
  }

  return `+${delta} п.п. за неделю`;
}

function formatProjectParticipants(project: {
  memberNames: string[];
  ownerStudentName: string;
}) {
  return project.memberNames.length > 0
    ? project.memberNames.join(", ")
    : project.ownerStudentName;
}

export async function buildProjectWeeklyStatusMarkdownReport() {
  const weekStart = toIsoDate(startOfCurrentWeek());
  const weekStartDate = new Date(`${weekStart}T00:00:00.000Z`);
  const weekRange = formatWeekRangeLabel(weekStart);
  const projects = (await listProjects()).filter((project) =>
    isProjectCurrent(project.status),
  );
  const reportsByProjectId = await listProjectAiReportsByProjectIds(
    projects.map((project) => project.id),
  );

  const normalizedProjects = projects.map((project) => {
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
    const hasChangesThisWeek =
      project.lastCommitDaysAgo !== null && project.lastCommitDaysAgo <= 7;
    const hasProgressGrowth = progressDelta !== null && progressDelta > 0;
    const isHealthyMoving =
      project.hasAiAnalysisSnapshot &&
      project.risk === "healthy" &&
      hasChangesThisWeek &&
      hasProgressGrowth;
    const isAbandoned =
      project.risk === "abandoned" ||
      project.isAbandoned ||
      (project.lastCommitDaysAgo !== null && project.lastCommitDaysAgo > 7);

    return {
      project,
      hasChangesThisWeek,
      progressDelta,
      isHealthyMoving,
      isAbandoned,
    };
  });

  const healthyMovingProjects = normalizedProjects.filter(
    (item) => item.isHealthyMoving,
  );
  const abandonedProjects = normalizedProjects.filter(
    (item) => item.isAbandoned,
  );
  const lines = [
    `# Еженедельный отчет по проектам`,
    "",
    `**Неделя:** ${weekRange}`,
    `**Текущих проектов:** ${projects.length}`,
    `**Нормальная динамика:** ${healthyMovingProjects.length}`,
    `**Заброшены:** ${abandonedProjects.length}`,
  ];

  lines.push("");
  lines.push("## Нормальная динамика");

  if (healthyMovingProjects.length === 0) {
    lines.push(
      "- За эту неделю не найдено проектов, где одновременно есть стабильный статус, новые изменения и рост прогресса.",
    );
  } else {
    lines.push(
      ...healthyMovingProjects.map(({ project, progressDelta }) => {
        return `- ${formatProjectParticipants(project)} / ${project.name} — ${project.progress}% (${buildProgressDeltaLabel(progressDelta)}; ${formatLastCommitLabel(project.lastCommitDaysAgo)})`;
      }),
    );
  }

  lines.push("");
  lines.push("## Заброшенные проекты");

  if (abandonedProjects.length === 0) {
    lines.push("- Заброшенные проекты не обнаружены.");
  } else {
    lines.push(
      ...abandonedProjects.map(({ project, progressDelta }) => {
        return `- ${formatProjectParticipants(project)} / ${project.name} — ${project.hasAiAnalysisSnapshot ? `${project.progress}%` : "нет данных"} (${getProjectRiskLabel(project.risk)}; ${formatLastCommitLabel(project.lastCommitDaysAgo)}; ${buildProgressDeltaLabel(progressDelta)})`;
      }),
    );
  }

  return lines.join("\n");
}
