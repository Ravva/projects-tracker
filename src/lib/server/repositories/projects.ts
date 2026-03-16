import "server-only";

import { AppwriteException, ID, Query } from "node-appwrite";
import {
  normalizeProjectInput,
  normalizeProjectState,
} from "@/lib/project-limits";
import { isProjectCurrent, normalizeProjectStatus } from "@/lib/project-status";
import {
  getAiGatewayModel,
  requestAiGatewayJsonObject,
} from "@/lib/server/ai-gateway";
import { getAppwriteConfig, getAppwriteDatabases } from "@/lib/server/appwrite";
import {
  GithubRequestError,
  getGithubRepositoryMetadata,
  listGithubRepositoryCommits,
} from "@/lib/server/github";
import {
  mapProjectAiReportDocument,
  mapProjectDocument,
} from "@/lib/server/mappers";
import {
  type ProjectAiInputSnapshot,
  serializeProjectAiInputSnapshot,
} from "@/lib/server/project-ai-report-snapshot";
import { analyzeProjectRepository } from "@/lib/server/project-repository-analysis";
import { listStudentNameMap } from "@/lib/server/repositories/students";
import type {
  ProjectAiReportRecord,
  ProjectInput,
  ProjectRecord,
  ProjectRisk,
  ProjectStatus,
} from "@/lib/types";

const PROJECT_SELECTION_LOCK_TTL_MS = 2 * 60 * 1000;

function buildProjectSelectionLockId(studentId: string) {
  return `student-project-selection:${studentId}`;
}

function getProjectSelectionLockExpiry() {
  return new Date(Date.now() + PROJECT_SELECTION_LOCK_TTL_MS).toISOString();
}

function isLockExpired(expiresAt: string) {
  const expiresAtTime = new Date(expiresAt).getTime();

  return Number.isNaN(expiresAtTime) || expiresAtTime <= Date.now();
}

async function acquireProjectSelectionLock(studentId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const lockId = buildProjectSelectionLockId(studentId);
  const lockPayload = {
    student_id: studentId,
    expires_at: getProjectSelectionLockExpiry(),
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await appwrite.databases.createDocument(
        appwrite.databaseId,
        config.collections.projectSelectionLocks,
        lockId,
        lockPayload,
      );

      return {
        release: async () => {
          try {
            await appwrite.databases.deleteDocument(
              appwrite.databaseId,
              config.collections.projectSelectionLocks,
              lockId,
            );
          } catch {}
        },
      };
    } catch (error) {
      const isConflict =
        error instanceof AppwriteException &&
        (error.code === 409 || error.type.includes("already_exists"));

      if (!isConflict) {
        throw error;
      }

      try {
        const existingLock = await appwrite.databases.getDocument(
          appwrite.databaseId,
          config.collections.projectSelectionLocks,
          lockId,
        );
        const expiresAt = String(
          (existingLock as Record<string, unknown>).expires_at ?? "",
        );

        if (!isLockExpired(expiresAt) || attempt > 0) {
          throw new Error(
            "Выбор или смена статуса проекта уже обрабатывается. Повторите через несколько секунд.",
          );
        }

        await appwrite.databases.deleteDocument(
          appwrite.databaseId,
          config.collections.projectSelectionLocks,
          lockId,
        );
      } catch (lockError) {
        if (lockError instanceof Error) {
          throw lockError;
        }

        throw new Error(
          "Не удалось получить блокировку выбора проекта. Повторите через несколько секунд.",
        );
      }
    }
  }

  throw new Error(
    "Не удалось получить блокировку выбора проекта. Повторите через несколько секунд.",
  );
}

function shouldPromoteProjectToActive(input: {
  hasRepository: boolean;
  hasMemoryBank: boolean;
  hasSpec: boolean;
  hasPlan: boolean;
}) {
  return (
    input.hasRepository && input.hasMemoryBank && input.hasSpec && input.hasPlan
  );
}

function hasProjectAiAnalysisSnapshot(
  project: Pick<ProjectRecord, "hasAiAnalysisSnapshot">,
) {
  return project.hasAiAnalysisSnapshot;
}

function parseGithubUrl(githubUrl: string) {
  const match = githubUrl
    .trim()
    .match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?$/i);

  if (!match) {
    return null;
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}

function buildProjectPayload(input: ProjectInput) {
  const normalizedInput = normalizeProjectInput(input);

  return {
    student_id: normalizedInput.studentId,
    name: normalizedInput.name,
    summary: normalizedInput.summary,
    github_url: normalizedInput.githubUrl,
    status: normalizedInput.status,
    spec_markdown: normalizedInput.specMarkdown,
    plan_markdown: normalizedInput.planMarkdown,
  };
}

function buildGithubState(
  input: Partial<{
    owner: string;
    repo: string;
    defaultBranch: string;
    lastCommitAt: string;
    lastCommitSha: string;
    lastSyncAt: string;
  }> = {},
) {
  return JSON.stringify({
    owner: input.owner ?? "",
    repo: input.repo ?? "",
    defaultBranch: input.defaultBranch ?? "main",
    lastCommitAt: input.lastCommitAt ?? "",
    lastCommitSha: input.lastCommitSha ?? "",
    lastSyncAt: input.lastSyncAt ?? "",
  });
}

function buildProjectState(
  input: Partial<{
    primaryRisk: string;
    riskFlags: string[];
    aiCompletionPercent: number;
    manualCompletionPercent: number | null;
    manualOverrideEnabled: boolean;
    manualOverrideNote: string;
    lastAiAnalysisAt: string;
    aiSummary: string;
    nextSteps: string[];
    hasRepository: boolean;
    hasMemoryBank: boolean;
    hasSpec: boolean;
    hasPlan: boolean;
    trackedTasksTotal: number;
    trackedTasksCompleted: number;
    trackedTasksInProgress: number;
    trackedTasksPending: number;
    commitCount: number;
    commitsPerWeek: number;
    lastCommitDaysAgo: number | null;
    isAbandoned: boolean;
  }> = {},
) {
  return JSON.stringify(normalizeProjectState(input));
}

function normalizeProjectRiskFlags(project: ProjectRecord) {
  const flags = new Set<ProjectRisk>();
  const analysisSnapshotAvailable = hasProjectAiAnalysisSnapshot(project);

  if (!analysisSnapshotAvailable) {
    for (const flag of project.riskFlags) {
      if (
        flag === "invalid_github_repo" ||
        flag === "abandoned" ||
        flag === "stale_repo"
      ) {
        flags.add(flag === "stale_repo" ? "abandoned" : flag);
      }
    }

    if (project.isAbandoned) {
      flags.add("abandoned");
    }

    return [...flags];
  }

  if (!project.hasMemoryBank) {
    flags.add("missing_memory_bank");
  }

  if (!project.hasSpec) {
    flags.add("missing_spec");
  }

  if (!project.hasPlan) {
    flags.add("missing_plan");
  }

  if (project.progress < 25 && project.trackedTasksTotal > 0) {
    flags.add("low_progress");
  }

  if (project.isAbandoned) {
    flags.add("abandoned");
  }

  for (const flag of project.riskFlags) {
    if (flag === "stale_repo") {
      flags.add("abandoned");
      continue;
    }

    flags.add(flag);
  }

  return [...flags];
}

function primaryRiskFromFlags(
  flags: ProjectRisk[],
  options: {
    hasAiAnalysisSnapshot: boolean;
  },
): ProjectRisk {
  if (flags.includes("invalid_github_repo")) {
    return "invalid_github_repo";
  }

  if (flags.includes("abandoned") || flags.includes("stale_repo")) {
    return "abandoned";
  }

  if (!options.hasAiAnalysisSnapshot) {
    return "data_missing";
  }

  if (flags.includes("missing_memory_bank")) {
    return "missing_memory_bank";
  }

  if (flags.includes("missing_spec")) {
    return "missing_spec";
  }

  if (flags.includes("missing_plan")) {
    return "missing_plan";
  }

  if (flags.includes("low_progress")) {
    return "low_progress";
  }

  return "healthy";
}

function buildProjectStateFromProject(
  project: ProjectRecord,
  overrides: Partial<Parameters<typeof normalizeProjectState>[0]> = {},
) {
  return buildProjectState({
    primaryRisk: project.risk,
    riskFlags: project.riskFlags,
    aiCompletionPercent: project.aiCompletionPercent,
    manualCompletionPercent: project.manualCompletionPercent,
    manualOverrideEnabled: project.manualOverrideEnabled,
    manualOverrideNote: project.manualOverrideNote,
    lastAiAnalysisAt:
      project.lastAiAnalysisAt === "Нет данных" ? "" : project.lastAiAnalysisAt,
    aiSummary: project.aiSummary,
    nextSteps: project.nextSteps,
    hasRepository: project.hasRepository,
    hasMemoryBank: project.hasMemoryBank,
    hasSpec: project.hasSpec,
    hasPlan: project.hasPlan,
    trackedTasksTotal: project.trackedTasksTotal,
    trackedTasksCompleted: project.trackedTasksCompleted,
    trackedTasksInProgress: project.trackedTasksInProgress,
    trackedTasksPending: project.trackedTasksPending,
    commitCount: project.commitCount,
    commitsPerWeek: project.commitsPerWeek,
    lastCommitDaysAgo: project.lastCommitDaysAgo,
    isAbandoned: project.isAbandoned,
    ...overrides,
  });
}

function buildProjectReportPayload(input: {
  projectName: string;
  projectSummary: string;
  github: {
    url: string;
    owner: string;
    repo: string;
    branch: string;
    lastCommit: string;
    lastCommitSha: string;
    commitCount: number;
    commitsPerWeek: number;
    lastCommitDaysAgo: number | null;
    isAbandoned: boolean;
  };
  repositorySignals: {
    hasRepository: boolean;
    hasMemoryBank: boolean;
    hasSpec: boolean;
    hasPlan: boolean;
    sourceFiles: string[];
  };
  taskMetrics: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    completionPercent: number;
  };
  taskHighlights: {
    completed: string[];
    inProgress: string[];
    pending: string[];
  };
  memoryBank: {
    projectBrief: string;
    productContext: string;
    activeContext: string;
    progress: string;
    docsReadme: string;
  };
  implementedItems: string[];
  partialItems: string[];
  missingItems: string[];
  risks: string[];
  nextSteps: string[];
}) {
  const inputSnapshot: ProjectAiInputSnapshot = {
    name: input.projectName,
    summary: input.projectSummary,
    github: input.github,
    repositorySignals: input.repositorySignals,
    taskMetrics: input.taskMetrics,
    taskHighlights: input.taskHighlights,
    memoryBank: input.memoryBank,
  };

  return JSON.stringify({
    inputSnapshotJson: serializeProjectAiInputSnapshot(inputSnapshot),
    implementedItems: input.implementedItems,
    partialItems: input.partialItems,
    missingItems: input.missingItems,
    risks: input.risks,
    nextSteps: input.nextSteps,
    sourceFiles: input.repositorySignals.sourceFiles,
    hasRepository: input.repositorySignals.hasRepository,
    hasMemoryBank: input.repositorySignals.hasMemoryBank,
    hasSpec: input.repositorySignals.hasSpec,
    hasPlan: input.repositorySignals.hasPlan,
    trackedTasksTotal: input.taskMetrics.total,
    trackedTasksCompleted: input.taskMetrics.completed,
    trackedTasksInProgress: input.taskMetrics.inProgress,
    trackedTasksPending: input.taskMetrics.pending,
    commitCount: input.github.commitCount,
    commitsPerWeek: input.github.commitsPerWeek,
    lastCommitDaysAgo: input.github.lastCommitDaysAgo,
    isAbandoned: input.github.isAbandoned,
  });
}

function isGithubRateLimitError(error: unknown) {
  return error instanceof GithubRequestError && error.isRateLimit;
}

async function listProjectDocuments() {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return [];
  }

  const response = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.projects,
    [Query.orderDesc("$updatedAt"), Query.limit(500)],
  );

  return response.documents;
}

async function listProjectDocumentsByStudent(studentId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return [];
  }

  const response = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.projects,
    [
      Query.equal("student_id", studentId),
      Query.orderDesc("$updatedAt"),
      Query.limit(100),
    ],
  );

  return response.documents;
}

export async function listCurrentProjectsByStudentId(
  studentId: string,
): Promise<ProjectRecord[]> {
  const projects = await listProjectsByStudentId(studentId);

  return projects.filter((project) => isProjectCurrent(project.status));
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return [];
  }

  try {
    const [documents, studentNameMap] = await Promise.all([
      listProjectDocuments(),
      listStudentNameMap(),
    ]);

    return documents.map((document) => {
      const studentId = String(
        (document as Record<string, unknown>).student_id ?? "",
      );
      const project = mapProjectDocument(
        document,
        studentNameMap.get(studentId) ?? "Неизвестный ученик",
      );
      const riskFlags = normalizeProjectRiskFlags(project);

      return {
        ...project,
        riskFlags,
        risk: primaryRiskFromFlags(riskFlags, {
          hasAiAnalysisSnapshot: hasProjectAiAnalysisSnapshot(project),
        }),
      };
    });
  } catch {
    return [];
  }
}

export async function listProjectsByStudentId(
  studentId: string,
): Promise<ProjectRecord[]> {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return [];
  }

  try {
    const [documents, studentNameMap] = await Promise.all([
      listProjectDocumentsByStudent(studentId),
      listStudentNameMap(),
    ]);

    return documents.map((document) => {
      const project = mapProjectDocument(
        document,
        studentNameMap.get(studentId) ?? "Неизвестный ученик",
      );
      const riskFlags = normalizeProjectRiskFlags(project);

      return {
        ...project,
        riskFlags,
        risk: primaryRiskFromFlags(riskFlags, {
          hasAiAnalysisSnapshot: hasProjectAiAnalysisSnapshot(project),
        }),
      };
    });
  } catch {
    return [];
  }
}

export async function getProject(
  projectId: string,
): Promise<ProjectRecord | null> {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return null;
  }

  try {
    const [document, studentNameMap] = await Promise.all([
      appwrite.databases.getDocument(
        appwrite.databaseId,
        config.collections.projects,
        projectId,
      ),
      listStudentNameMap(),
    ]);
    const studentId = String(
      (document as Record<string, unknown>).student_id ?? "",
    );
    const project = mapProjectDocument(
      document,
      studentNameMap.get(studentId) ?? "Неизвестный ученик",
    );
    const riskFlags = normalizeProjectRiskFlags(project);

    return {
      ...project,
      riskFlags,
      risk: primaryRiskFromFlags(riskFlags, {
        hasAiAnalysisSnapshot: hasProjectAiAnalysisSnapshot(project),
      }),
    };
  } catch {
    return null;
  }
}

export async function createProject(input: ProjectInput) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  return appwrite.databases.createDocument(
    appwrite.databaseId,
    config.collections.projects,
    ID.unique(),
    {
      ...buildProjectPayload(input),
      github_state_json: buildGithubState(),
      project_state_json: buildProjectState(),
    },
  );
}

export async function createStudentProjectFromGithubSelection(input: {
  studentId: string;
  studentName: string;
  repositoryName: string;
  repositoryUrl: string;
  repositoryDescription: string;
}) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const normalizedUrl = input.repositoryUrl.trim();

  if (!parseGithubUrl(normalizedUrl)) {
    throw new Error("Выбран некорректный GitHub URL.");
  }
  const lock = await acquireProjectSelectionLock(input.studentId);

  try {
    const existingProjects = await listProjectsByStudentId(input.studentId);

    if (
      existingProjects.some(
        (project) => project.githubUrl.trim() === normalizedUrl,
      )
    ) {
      throw new Error("Этот репозиторий уже выбран для текущего ученика.");
    }

    if (existingProjects.some((project) => isProjectCurrent(project.status))) {
      throw new Error(
        "Сначала завершите текущий проект ученика, затем можно выбрать следующий репозиторий.",
      );
    }

    return await appwrite.databases.createDocument(
      appwrite.databaseId,
      config.collections.projects,
      ID.unique(),
      {
        ...buildProjectPayload({
          studentId: input.studentId,
          name: input.repositoryName.trim() || `Проект ${input.studentName}`,
          summary: input.repositoryDescription.trim(),
          githubUrl: normalizedUrl,
          status: "draft",
          specMarkdown: "",
          planMarkdown: "",
        }),
        github_state_json: buildGithubState(),
        project_state_json: buildProjectState(),
      },
    );
  } finally {
    await lock.release();
  }
}

export async function setProjectStatus(
  projectId: string,
  nextStatus: ProjectStatus,
) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const project = await getProject(projectId);

  if (!appwrite || !config || !project) {
    throw new Error("Проект не найден.");
  }

  const normalizedStatus = normalizeProjectStatus(nextStatus);
  const lock = await acquireProjectSelectionLock(project.studentId);

  try {
    if (normalizedStatus === "active") {
      const studentProjects = await listProjectsByStudentId(project.studentId);
      const hasOtherCurrentProject = studentProjects.some(
        (studentProject) =>
          studentProject.id !== projectId &&
          isProjectCurrent(studentProject.status),
      );

      if (hasOtherCurrentProject) {
        throw new Error(
          "У ученика уже есть другой текущий проект. Сначала завершите его или оставьте этот проект завершенным.",
        );
      }
    }

    return await appwrite.databases.updateDocument(
      appwrite.databaseId,
      config.collections.projects,
      projectId,
      {
        status: normalizedStatus,
      },
    );
  } finally {
    await lock.release();
  }
}

export async function updateProject(projectId: string, input: ProjectInput) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  return appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.projects,
    projectId,
    buildProjectPayload(input),
  );
}

export async function deleteProject(projectId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const reports = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.projectAiReports,
    [Query.equal("project_id", projectId), Query.limit(500)],
  );

  for (const report of reports.documents) {
    await appwrite.databases.deleteDocument(
      appwrite.databaseId,
      config.collections.projectAiReports,
      report.$id,
    );
  }

  return appwrite.databases.deleteDocument(
    appwrite.databaseId,
    config.collections.projects,
    projectId,
  );
}

async function updateProjectRiskFlags(projectId: string, flags: ProjectRisk[]) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const project = await getProject(projectId);

  if (!appwrite || !config || !project) {
    throw new Error("Appwrite не настроен.");
  }

  await appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.projects,
    projectId,
    {
      project_state_json: buildProjectStateFromProject(project, {
        primaryRisk: primaryRiskFromFlags(flags, {
          hasAiAnalysisSnapshot: hasProjectAiAnalysisSnapshot(project),
        }),
        riskFlags: flags,
      }),
    },
  );
}

export async function syncProjectGithub(projectId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const project = await getProject(projectId);

  if (!appwrite || !config || !project) {
    throw new Error("Проект не найден.");
  }

  const parsed = parseGithubUrl(project.githubUrl);

  if (!parsed) {
    await updateProjectRiskFlags(projectId, ["invalid_github_repo"]);
    throw new Error("Некорректный GitHub URL.");
  }

  try {
    const metadata = await getGithubRepositoryMetadata(
      parsed.owner,
      parsed.repo,
    );
    const commitData = await listGithubRepositoryCommits(
      parsed.owner,
      parsed.repo,
      metadata.defaultBranch,
      {
        maxPages: 1,
        perPage: 1,
      },
    );
    const lastCommit = commitData[0];
    const riskFlags = normalizeProjectRiskFlags({
      ...project,
      hasRepository: true,
      githubOwner: parsed.owner,
      githubRepo: parsed.repo,
      defaultBranch: metadata.defaultBranch,
      lastCommit: lastCommit?.committedAt ?? "",
      lastCommitSha: lastCommit?.sha ?? "",
      lastSyncAt: new Date().toISOString(),
      lastCommitDaysAgo: lastCommit?.committedAt
        ? Math.floor(
            (Date.now() - new Date(lastCommit.committedAt).getTime()) /
              (24 * 60 * 60 * 1000),
          )
        : null,
      isAbandoned: lastCommit?.committedAt
        ? Math.floor(
            (Date.now() - new Date(lastCommit.committedAt).getTime()) /
              (24 * 60 * 60 * 1000),
          ) > 7
        : true,
      riskFlags: project.riskFlags.filter(
        (flag) => flag !== "invalid_github_repo" && flag !== "stale_repo",
      ),
    });

    await appwrite.databases.updateDocument(
      appwrite.databaseId,
      config.collections.projects,
      projectId,
      {
        github_url: metadata.htmlUrl,
        github_state_json: buildGithubState({
          owner: parsed.owner,
          repo: parsed.repo,
          defaultBranch: metadata.defaultBranch,
          lastCommitAt: lastCommit?.committedAt ?? "",
          lastCommitSha: lastCommit?.sha ?? "",
          lastSyncAt: new Date().toISOString(),
        }),
        project_state_json: buildProjectStateFromProject(project, {
          primaryRisk: primaryRiskFromFlags(riskFlags, {
            hasAiAnalysisSnapshot: hasProjectAiAnalysisSnapshot(project),
          }),
          riskFlags,
          hasRepository: true,
          lastCommitDaysAgo: lastCommit?.committedAt
            ? Math.floor(
                (Date.now() - new Date(lastCommit.committedAt).getTime()) /
                  (24 * 60 * 60 * 1000),
              )
            : null,
          isAbandoned: lastCommit?.committedAt
            ? Math.floor(
                (Date.now() - new Date(lastCommit.committedAt).getTime()) /
                  (24 * 60 * 60 * 1000),
              ) > 7
            : true,
        }),
      },
    );
  } catch (error) {
    if (isGithubRateLimitError(error)) {
      throw new Error(
        "Превышен лимит GitHub API. Добавьте GITHUB_TOKEN и повторите позже.",
      );
    }

    await updateProjectRiskFlags(projectId, ["invalid_github_repo"]);
    throw new Error("Не удалось синхронизировать GitHub-репозиторий.");
  }
}

export async function runProjectAiAnalysis(projectId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const project = await getProject(projectId);

  if (!appwrite || !config || !project) {
    throw new Error("Проект не найден.");
  }

  const aiModel = getAiGatewayModel();
  const parsedGithubUrl = parseGithubUrl(project.githubUrl);

  if (!parsedGithubUrl) {
    await updateProjectRiskFlags(projectId, ["invalid_github_repo"]);
    throw new Error("Некорректный GitHub URL.");
  }

  let repositoryAnalysis: Awaited<ReturnType<typeof analyzeProjectRepository>>;

  try {
    repositoryAnalysis = await analyzeProjectRepository({
      owner: parsedGithubUrl.owner,
      repo: parsedGithubUrl.repo,
    });
  } catch (error) {
    if (isGithubRateLimitError(error)) {
      throw new Error(
        "Превышен лимит GitHub API. Добавьте GITHUB_TOKEN и повторите позже.",
      );
    }

    await updateProjectRiskFlags(projectId, ["invalid_github_repo"]);
    throw new Error("Не удалось собрать данные проекта из GitHub.");
  }
  const completionPercent = repositoryAnalysis.metrics.completionPercent;
  const nextRiskFlags = normalizeProjectRiskFlags({
    ...project,
    riskFlags: project.riskFlags.filter(
      (flag) => flag !== "invalid_github_repo" && flag !== "stale_repo",
    ),
    progress: completionPercent,
    aiCompletionPercent: completionPercent,
    hasRepository: repositoryAnalysis.repository.hasRepository,
    hasMemoryBank: repositoryAnalysis.metrics.hasMemoryBank,
    hasSpec: repositoryAnalysis.metrics.hasSpec,
    hasPlan: repositoryAnalysis.metrics.hasPlan,
    trackedTasksTotal: repositoryAnalysis.metrics.trackedTasksTotal,
    trackedTasksCompleted: repositoryAnalysis.metrics.trackedTasksCompleted,
    trackedTasksInProgress: repositoryAnalysis.metrics.trackedTasksInProgress,
    trackedTasksPending: repositoryAnalysis.metrics.trackedTasksPending,
    commitCount: repositoryAnalysis.metrics.commitCount,
    commitsPerWeek: repositoryAnalysis.metrics.commitsPerWeek,
    lastCommit: repositoryAnalysis.metrics.lastCommitAt,
    lastCommitSha: repositoryAnalysis.metrics.lastCommitSha,
    lastCommitDaysAgo: repositoryAnalysis.metrics.lastCommitDaysAgo,
    isAbandoned: repositoryAnalysis.metrics.isAbandoned,
    githubOwner: repositoryAnalysis.repository.owner,
    githubRepo: repositoryAnalysis.repository.repo,
    defaultBranch: repositoryAnalysis.repository.defaultBranch,
    githubUrl: repositoryAnalysis.repository.htmlUrl,
  });
  const inputSnapshot: ProjectAiInputSnapshot = {
    name: project.name,
    summary: project.summary,
    github: {
      url: repositoryAnalysis.repository.htmlUrl,
      owner: repositoryAnalysis.repository.owner,
      repo: repositoryAnalysis.repository.repo,
      branch: repositoryAnalysis.repository.defaultBranch,
      lastCommit: repositoryAnalysis.metrics.lastCommitAt,
      lastCommitSha: repositoryAnalysis.metrics.lastCommitSha,
      commitCount: repositoryAnalysis.metrics.commitCount,
      commitsPerWeek: repositoryAnalysis.metrics.commitsPerWeek,
      lastCommitDaysAgo: repositoryAnalysis.metrics.lastCommitDaysAgo,
      isAbandoned: repositoryAnalysis.metrics.isAbandoned,
    },
    repositorySignals: {
      hasRepository: repositoryAnalysis.repository.hasRepository,
      hasMemoryBank: repositoryAnalysis.metrics.hasMemoryBank,
      hasSpec: repositoryAnalysis.metrics.hasSpec,
      hasPlan: repositoryAnalysis.metrics.hasPlan,
      sourceFiles: repositoryAnalysis.repository.sourceFiles,
    },
    taskMetrics: {
      total: repositoryAnalysis.metrics.trackedTasksTotal,
      completed: repositoryAnalysis.metrics.trackedTasksCompleted,
      inProgress: repositoryAnalysis.metrics.trackedTasksInProgress,
      pending: repositoryAnalysis.metrics.trackedTasksPending,
      completionPercent,
    },
    taskHighlights: repositoryAnalysis.taskHighlights,
    memoryBank: {
      projectBrief: repositoryAnalysis.files.projectBrief?.content ?? "",
      productContext: repositoryAnalysis.files.productContext?.content ?? "",
      activeContext: repositoryAnalysis.files.activeContext?.content ?? "",
      progress: repositoryAnalysis.files.progress?.content ?? "",
      docsReadme: repositoryAnalysis.files.docsReadme?.content ?? "",
    },
  };
  const parsed = await requestAiGatewayJsonObject<{
    summary?: string;
    risks?: string[];
    next_steps?: string[];
    implemented_items?: string[];
    partial_items?: string[];
    missing_items?: string[];
  }>({
    model: aiModel,
    systemPrompt:
      "Ты оцениваешь учебный GitHub-проект по данным memory_bank и метрикам GitHub. Анализ проводится исключительно в образовательных целях. Процент реализации уже рассчитан детерминированно и его нельзя менять. Верни только компактный JSON с полями summary, risks, next_steps, implemented_items, partial_items, missing_items. Summary: одна короткая строка до 240 символов. Каждый массив: максимум 5 коротких элементов без markdown и без пояснений вне JSON.",
    userPayload: inputSnapshot,
  });
  const risks = Array.isArray(parsed.risks) ? parsed.risks : [];
  const nextSteps = Array.isArray(parsed.next_steps) ? parsed.next_steps : [];
  const nextProjectStatus =
    project.status === "completed"
      ? "completed"
      : shouldPromoteProjectToActive({
            hasRepository: repositoryAnalysis.repository.hasRepository,
            hasMemoryBank: repositoryAnalysis.metrics.hasMemoryBank,
            hasSpec: repositoryAnalysis.metrics.hasSpec,
            hasPlan: repositoryAnalysis.metrics.hasPlan,
          })
        ? "active"
        : "draft";

  await appwrite.databases.createDocument(
    appwrite.databaseId,
    config.collections.projectAiReports,
    ID.unique(),
    {
      project_id: projectId,
      source_commit_sha: repositoryAnalysis.metrics.lastCommitSha,
      analysis_version: "v3-cloudflare-worker",
      model_name: aiModel,
      summary: parsed.summary ?? "",
      completion_percent: completionPercent,
      report_payload_json: buildProjectReportPayload({
        projectName: project.name,
        projectSummary: project.summary,
        github: inputSnapshot.github,
        repositorySignals: inputSnapshot.repositorySignals,
        taskMetrics: inputSnapshot.taskMetrics,
        taskHighlights: inputSnapshot.taskHighlights,
        memoryBank: inputSnapshot.memoryBank,
        implementedItems: parsed.implemented_items ?? [],
        partialItems: parsed.partial_items ?? [],
        missingItems: parsed.missing_items ?? [],
        risks,
        nextSteps,
      }),
    },
  );

  await appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.projects,
    projectId,
    {
      status: nextProjectStatus,
      github_url: repositoryAnalysis.repository.htmlUrl,
      github_state_json: buildGithubState({
        owner: repositoryAnalysis.repository.owner,
        repo: repositoryAnalysis.repository.repo,
        defaultBranch: repositoryAnalysis.repository.defaultBranch,
        lastCommitAt: repositoryAnalysis.metrics.lastCommitAt,
        lastCommitSha: repositoryAnalysis.metrics.lastCommitSha,
        lastSyncAt: new Date().toISOString(),
      }),
      project_state_json: buildProjectStateFromProject(project, {
        primaryRisk: primaryRiskFromFlags(nextRiskFlags, {
          hasAiAnalysisSnapshot: true,
        }),
        riskFlags: nextRiskFlags,
        aiCompletionPercent: completionPercent,
        manualCompletionPercent: project.manualCompletionPercent,
        manualOverrideEnabled: false,
        manualOverrideNote: project.manualOverrideNote,
        lastAiAnalysisAt: new Date().toISOString(),
        aiSummary: parsed.summary ?? "",
        nextSteps,
        hasRepository: repositoryAnalysis.repository.hasRepository,
        hasMemoryBank: repositoryAnalysis.metrics.hasMemoryBank,
        hasSpec: repositoryAnalysis.metrics.hasSpec,
        hasPlan: repositoryAnalysis.metrics.hasPlan,
        trackedTasksTotal: repositoryAnalysis.metrics.trackedTasksTotal,
        trackedTasksCompleted: repositoryAnalysis.metrics.trackedTasksCompleted,
        trackedTasksInProgress:
          repositoryAnalysis.metrics.trackedTasksInProgress,
        trackedTasksPending: repositoryAnalysis.metrics.trackedTasksPending,
        commitCount: repositoryAnalysis.metrics.commitCount,
        commitsPerWeek: repositoryAnalysis.metrics.commitsPerWeek,
        lastCommitDaysAgo: repositoryAnalysis.metrics.lastCommitDaysAgo,
        isAbandoned: repositoryAnalysis.metrics.isAbandoned,
      }),
    },
  );
}

export async function setProjectManualOverride(
  projectId: string,
  percent: number,
  note: string,
) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const project = await getProject(projectId);

  if (!appwrite || !config || !project) {
    throw new Error("Appwrite не настроен.");
  }

  return appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.projects,
    projectId,
    {
      project_state_json: buildProjectStateFromProject(project, {
        manualCompletionPercent: percent,
        manualOverrideEnabled: true,
        manualOverrideNote: note,
      }),
    },
  );
}

export async function clearProjectManualOverride(projectId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const project = await getProject(projectId);

  if (!appwrite || !config || !project) {
    throw new Error("Appwrite не настроен.");
  }

  return appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.projects,
    projectId,
    {
      project_state_json: buildProjectStateFromProject(project, {
        manualOverrideEnabled: false,
        manualOverrideNote: "",
      }),
    },
  );
}

export async function listProjectAiReports(
  projectId: string,
): Promise<ProjectAiReportRecord[]> {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return [];
  }

  try {
    const response = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      config.collections.projectAiReports,
      [
        Query.equal("project_id", projectId),
        Query.orderDesc("$createdAt"),
        Query.limit(20),
      ],
    );

    return response.documents.map((document) =>
      mapProjectAiReportDocument(document),
    );
  } catch {
    return [];
  }
}
