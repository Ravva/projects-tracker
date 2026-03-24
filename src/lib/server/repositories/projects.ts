import "server-only";

import crypto from "node:crypto";
import { AppwriteException, ID, Query } from "node-appwrite";
import {
  normalizeProjectInput,
  normalizeProjectState,
} from "@/lib/project-limits";
import { isProjectCurrent, normalizeProjectStatus } from "@/lib/project-status";
import {
  type AiProviderCode,
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
  mapProjectMembershipDocument,
} from "@/lib/server/mappers";
import {
  type ProjectAiInputSnapshot,
  serializeProjectAiInputSnapshot,
} from "@/lib/server/project-ai-report-snapshot";
import { deleteProjectCascade } from "@/lib/server/project-cleanup";
import { analyzeProjectRepository } from "@/lib/server/project-repository-analysis";
import { listStudentNameMap } from "@/lib/server/repositories/students";
import type {
  ProjectAiReportRecord,
  ProjectInput,
  ProjectMemberRecord,
  ProjectMemberRole,
  ProjectRecord,
  ProjectRisk,
  ProjectStatus,
} from "@/lib/types";

const PROJECT_SELECTION_LOCK_TTL_MS = 2 * 60 * 1000;

export type ProjectAiAnalysisResult = {
  providerCode: AiProviderCode;
  modelName: string;
};

function buildProjectSelectionLockId(studentId: string) {
  const digest = crypto
    .createHash("sha256")
    .update(studentId.trim())
    .digest("hex")
    .slice(0, 32);

  return `psl_${digest}`;
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

function buildProjectMembershipPayload(input: {
  projectId: string;
  studentId: string;
  role: ProjectMemberRole;
}) {
  return {
    project_id: input.projectId,
    student_id: input.studentId,
    role: input.role,
    joined_at: new Date().toISOString(),
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
    if (flag === "invalid_github_repo") {
      flags.add(flag);
    }
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
    progressCalculationStatus:
      | "valid"
      | "missing_projectbrief"
      | "missing_deliverables_section"
      | "no_parsable_deliverables"
      | "invalid_weight_sum";
    progressCalculationDetails: string;
    deliverablesWeightTotal: number;
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
    progressCalculationStatus: input.taskMetrics.progressCalculationStatus,
    progressCalculationDetails: input.taskMetrics.progressCalculationDetails,
    deliverablesWeightTotal: input.taskMetrics.deliverablesWeightTotal,
    commitCount: input.github.commitCount,
    commitsPerWeek: input.github.commitsPerWeek,
    lastCommitDaysAgo: input.github.lastCommitDaysAgo,
    isAbandoned: input.github.isAbandoned,
  });
}

function isGithubRateLimitError(error: unknown) {
  return error instanceof GithubRequestError && error.isRateLimit;
}

function getProjectBaseRecord(project: ProjectRecord) {
  const riskFlags = normalizeProjectRiskFlags(project);

  return {
    ...project,
    riskFlags,
    risk: primaryRiskFromFlags(riskFlags, {
      hasAiAnalysisSnapshot: hasProjectAiAnalysisSnapshot(project),
    }),
  };
}

async function enrichProjectRepositoryStatus(
  project: ProjectRecord,
): Promise<ProjectRecord> {
  const parsed = parseGithubUrl(project.githubUrl);

  if (!parsed) {
    return {
      ...project,
      syncStatus: "unavailable",
      syncStatusReason: "Некорректный GitHub URL.",
      aiStatus: project.hasAiAnalysisSnapshot
        ? "status_unknown"
        : "not_started",
    };
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
    const remoteLastCommitSha = lastCommit?.sha ?? "";
    const remoteLastCommit = lastCommit?.committedAt ?? "";
    const hasSyncSnapshot = Boolean(project.lastCommitSha.trim());
    const hasRepositoryUpdates =
      Boolean(remoteLastCommitSha) &&
      (!hasSyncSnapshot || remoteLastCommitSha !== project.lastCommitSha);

    return {
      ...project,
      syncStatus: hasRepositoryUpdates
        ? "sync_needed"
        : hasSyncSnapshot
          ? "synced"
          : "unknown",
      syncStatusReason: hasRepositoryUpdates
        ? "В GitHub есть новые коммиты относительно сохраненного snapshot."
        : hasSyncSnapshot
          ? ""
          : "Проект еще не синхронизировался с GitHub.",
      aiStatus: !project.hasAiAnalysisSnapshot
        ? "not_started"
        : hasRepositoryUpdates
          ? "outdated"
          : "up_to_date",
      remoteLastCommit,
      remoteLastCommitSha,
      defaultBranch: metadata.defaultBranch,
    };
  } catch (error) {
    const reason = isGithubRateLimitError(error)
      ? "Не удалось проверить GitHub: превышен rate limit."
      : "Не удалось проверить актуальность репозитория в GitHub.";

    return {
      ...project,
      syncStatus: "unavailable",
      syncStatusReason: reason,
      aiStatus: project.hasAiAnalysisSnapshot
        ? "status_unknown"
        : "not_started",
    };
  }
}

async function enrichProjectsRepositoryStatus(projects: ProjectRecord[]) {
  return Promise.all(
    projects.map(async (project) =>
      enrichProjectRepositoryStatus(getProjectBaseRecord(project)),
    ),
  );
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

async function listProjectMembershipDocumentsByProjectIds(
  projectIds: string[],
) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config || projectIds.length === 0) {
    return [];
  }

  const response = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.projectMemberships,
    [
      Query.equal("project_id", projectIds),
      Query.orderDesc("$updatedAt"),
      Query.limit(500),
    ],
  );

  return response.documents;
}

async function listProjectMembershipDocumentsByStudent(studentId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return [];
  }

  const response = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.projectMemberships,
    [
      Query.equal("student_id", studentId),
      Query.orderDesc("$updatedAt"),
      Query.limit(500),
    ],
  );

  return response.documents;
}

function buildMembershipsByProjectId(
  documents: Awaited<
    ReturnType<typeof listProjectMembershipDocumentsByProjectIds>
  >,
  studentNameMap: Map<string, string>,
) {
  const grouped = new Map<string, ProjectMemberRecord[]>();

  for (const document of documents) {
    const studentId = String(
      (document as Record<string, unknown>).student_id ?? "",
    );
    const membership = mapProjectMembershipDocument(
      document,
      studentNameMap.get(studentId) ?? "Неизвестный ученик",
    );
    const memberships = grouped.get(membership.projectId) ?? [];
    memberships.push(membership);
    grouped.set(membership.projectId, memberships);
  }

  return grouped;
}

function buildProjectRecordWithMembers(
  document: Awaited<ReturnType<typeof listProjectDocuments>>[number],
  studentNameMap: Map<string, string>,
  membershipsByProjectId: Map<string, ProjectMemberRecord[]>,
) {
  const ownerStudentId = String(
    (document as Record<string, unknown>).student_id ?? "",
  );
  const ownerStudentName =
    studentNameMap.get(ownerStudentId) ?? "Неизвестный ученик";
  const baseProject = mapProjectDocument(document, ownerStudentName);
  const memberships = membershipsByProjectId.get(baseProject.id) ?? [];
  const normalizedMemberships =
    memberships.length > 0
      ? memberships
      : [
          {
            id: `legacy-owner:${baseProject.id}:${ownerStudentId}`,
            projectId: baseProject.id,
            studentId: ownerStudentId,
            studentName: ownerStudentName,
            role: "owner" as const,
            joinedAt: document.$createdAt,
          },
        ];
  const hasOwnerMembership = normalizedMemberships.some(
    (membership) => membership.studentId === ownerStudentId,
  );

  if (!hasOwnerMembership && ownerStudentId) {
    normalizedMemberships.unshift({
      id: `legacy-owner:${baseProject.id}:${ownerStudentId}`,
      projectId: baseProject.id,
      studentId: ownerStudentId,
      studentName: ownerStudentName,
      role: "owner",
      joinedAt: document.$createdAt,
    });
  }
  const uniqueMembers = new Map<string, string>();

  for (const membership of normalizedMemberships) {
    if (!membership.studentId.trim()) {
      continue;
    }

    uniqueMembers.set(
      membership.studentId,
      membership.studentName || "Неизвестный ученик",
    );
  }

  if (uniqueMembers.size === 0 && ownerStudentId) {
    uniqueMembers.set(ownerStudentId, ownerStudentName);
  }

  return {
    ...baseProject,
    studentId: ownerStudentId,
    studentName: ownerStudentName,
    ownerStudentId,
    ownerStudentName,
    memberStudentIds: [...uniqueMembers.keys()],
    memberNames: [...uniqueMembers.values()],
    membersCount: uniqueMembers.size,
  } satisfies ProjectRecord;
}

async function listStudentProjectIds(studentId: string) {
  const membershipDocuments =
    await listProjectMembershipDocumentsByStudent(studentId);
  const projectIds = new Set(
    membershipDocuments.map((document) =>
      String((document as Record<string, unknown>).project_id ?? ""),
    ),
  );

  const legacyDocuments = await listProjectDocumentsByStudent(studentId);

  for (const document of legacyDocuments) {
    projectIds.add(document.$id);
  }

  return [...projectIds].filter(Boolean);
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
    const membershipsByProjectId = buildMembershipsByProjectId(
      await listProjectMembershipDocumentsByProjectIds(
        documents.map((document) => document.$id),
      ),
      studentNameMap,
    );

    const projects = documents.map((document) =>
      buildProjectRecordWithMembers(
        document,
        studentNameMap,
        membershipsByProjectId,
      ),
    );

    return enrichProjectsRepositoryStatus(projects);
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
    const [projectIds, studentNameMap] = await Promise.all([
      listStudentProjectIds(studentId),
      listStudentNameMap(),
    ]);

    if (projectIds.length === 0) {
      return [];
    }

    const [documents, membershipDocuments] = await Promise.all([
      listProjectDocuments(),
      listProjectMembershipDocumentsByProjectIds(projectIds),
    ]);
    const documentsById = new Map(
      documents.map((document) => [document.$id, document]),
    );
    const membershipsByProjectId = buildMembershipsByProjectId(
      membershipDocuments,
      studentNameMap,
    );
    const projects = projectIds
      .map((projectId) => documentsById.get(projectId))
      .filter((document): document is (typeof documents)[number] =>
        Boolean(document),
      )
      .map((document) =>
        buildProjectRecordWithMembers(
          document,
          studentNameMap,
          membershipsByProjectId,
        ),
      );

    return enrichProjectsRepositoryStatus(projects);
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
    const membershipsByProjectId = buildMembershipsByProjectId(
      await listProjectMembershipDocumentsByProjectIds([projectId]),
      studentNameMap,
    );

    const project = buildProjectRecordWithMembers(
      document,
      studentNameMap,
      membershipsByProjectId,
    );
    return enrichProjectRepositoryStatus(getProjectBaseRecord(project));
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

  const project = await appwrite.databases.createDocument(
    appwrite.databaseId,
    config.collections.projects,
    ID.unique(),
    {
      ...buildProjectPayload(input),
      github_state_json: buildGithubState(),
      project_state_json: buildProjectState(),
    },
  );

  await appwrite.databases.createDocument(
    appwrite.databaseId,
    config.collections.projectMemberships,
    ID.unique(),
    buildProjectMembershipPayload({
      projectId: project.$id,
      studentId: input.studentId,
      role: "owner",
    }),
  );

  return project;
}

export async function createStudentProjectFromGithubSelection(input: {
  studentId: string;
  studentName: string;
  repositoryName: string;
  repositoryUrl: string;
  repositoryDescription: string;
  repositoryPrivate: boolean;
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
  if (input.repositoryPrivate) {
    throw new Error(
      "Приватные GitHub-репозитории нельзя выбрать для student-flow. Откройте публичный репозиторий.",
    );
  }
  const lock = await acquireProjectSelectionLock(input.studentId);

  try {
    const existingProjects = await listProjectsByStudentId(input.studentId);
    const allProjects = await listProjects();

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
    if (
      allProjects.some(
        (project) => project.githubUrl.trim() === normalizedUrl.trim(),
      )
    ) {
      throw new Error(
        "Этот GitHub-репозиторий уже привязан к другому проекту. Для групповой работы преподаватель должен добавить второго участника в существующий проект.",
      );
    }

    return await createProject({
      studentId: input.studentId,
      name: input.repositoryName.trim() || `Проект ${input.studentName}`,
      summary: input.repositoryDescription.trim(),
      githubUrl: normalizedUrl,
      status: "draft",
      specMarkdown: "",
      planMarkdown: "",
    });
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
  const participantStudentIds = project.memberStudentIds.length
    ? project.memberStudentIds
    : [project.studentId];
  const locks = await Promise.all(
    participantStudentIds.map((studentId) =>
      acquireProjectSelectionLock(studentId),
    ),
  );

  try {
    if (normalizedStatus === "active") {
      for (const studentId of participantStudentIds) {
        const studentProjects = await listProjectsByStudentId(studentId);
        const hasOtherCurrentProject = studentProjects.some(
          (studentProject) =>
            studentProject.id !== projectId &&
            isProjectCurrent(studentProject.status),
        );

        if (hasOtherCurrentProject) {
          throw new Error(
            "У одного из участников уже есть другой текущий проект. Сначала завершите его или оставьте этот проект завершенным.",
          );
        }
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
    await Promise.all(locks.map((lock) => lock.release()));
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

export async function listProjectMembers(
  projectId: string,
): Promise<ProjectMemberRecord[]> {
  const [project, studentNameMap] = await Promise.all([
    getProject(projectId),
    listStudentNameMap(),
  ]);

  if (!project) {
    return [];
  }

  const membershipDocuments = await listProjectMembershipDocumentsByProjectIds([
    projectId,
  ]);
  const memberships = buildMembershipsByProjectId(
    membershipDocuments,
    studentNameMap,
  ).get(projectId);

  const normalizedMemberships = memberships ? [...memberships] : [];
  const hasOwnerMembership = normalizedMemberships.some(
    (membership) => membership.studentId === project.ownerStudentId,
  );

  if (!hasOwnerMembership) {
    normalizedMemberships.unshift({
      id: `legacy-owner:${project.id}:${project.ownerStudentId}`,
      projectId: project.id,
      studentId: project.ownerStudentId,
      studentName: project.ownerStudentName,
      role: "owner",
      joinedAt: "",
    });
  }

  return normalizedMemberships.sort((left, right) =>
    left.studentName.localeCompare(right.studentName, "ru"),
  );
}

export async function addProjectMember(projectId: string, studentId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const [project, studentProjects] = await Promise.all([
    getProject(projectId),
    listProjectsByStudentId(studentId),
  ]);

  if (!appwrite || !config || !project) {
    throw new Error("Проект не найден.");
  }

  if (project.memberStudentIds.includes(studentId)) {
    throw new Error("Этот ученик уже добавлен в проект.");
  }

  if (
    studentProjects.some((studentProject) =>
      isProjectCurrent(studentProject.status),
    )
  ) {
    throw new Error(
      "У ученика уже есть текущий проект. Сначала завершите его, затем можно добавить участие в групповом проекте.",
    );
  }

  const lock = await acquireProjectSelectionLock(studentId);

  try {
    const refreshedProjects = await listProjectsByStudentId(studentId);

    if (
      refreshedProjects.some((studentProject) =>
        isProjectCurrent(studentProject.status),
      )
    ) {
      throw new Error(
        "У ученика уже есть текущий проект. Сначала завершите его, затем можно добавить участие в групповом проекте.",
      );
    }

    return await appwrite.databases.createDocument(
      appwrite.databaseId,
      config.collections.projectMemberships,
      ID.unique(),
      buildProjectMembershipPayload({
        projectId,
        studentId,
        role: "member",
      }),
    );
  } finally {
    await lock.release();
  }
}

export async function removeProjectMember(
  projectId: string,
  studentId: string,
) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const [project, membershipDocuments] = await Promise.all([
    getProject(projectId),
    listProjectMembershipDocumentsByProjectIds([projectId]),
  ]);

  if (!appwrite || !config || !project) {
    throw new Error("Проект не найден.");
  }

  if (project.ownerStudentId === studentId) {
    throw new Error("Нельзя удалить владельца GitHub-репозитория из проекта.");
  }

  const membershipDocument = membershipDocuments.find(
    (document) =>
      String((document as Record<string, unknown>).student_id ?? "") ===
      studentId,
  );

  if (!membershipDocument) {
    throw new Error("Участник проекта не найден.");
  }

  return appwrite.databases.deleteDocument(
    appwrite.databaseId,
    config.collections.projectMemberships,
    membershipDocument.$id,
  );
}

export async function deleteProject(projectId: string) {
  return deleteProjectCascade(projectId);
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

export async function runProjectAiAnalysis(
  projectId: string,
): Promise<ProjectAiAnalysisResult> {
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
    hasAiAnalysisSnapshot: true,
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
      progressCalculationStatus:
        repositoryAnalysis.metrics.progressCalculationStatus,
      progressCalculationDetails:
        repositoryAnalysis.metrics.progressCalculationDetails,
      deliverablesWeightTotal:
        repositoryAnalysis.metrics.deliverablesWeightTotal,
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
  const aiResult = await requestAiGatewayJsonObject<{
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
  const parsed = aiResult.data;
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
      analysis_version: "v3-ai-gateway",
      model_name: `${aiResult.providerCode}:${aiResult.modelName}`,
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

  return {
    providerCode: aiResult.providerCode,
    modelName: aiResult.modelName,
  };
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

export async function listProjectAiReportsByProjectIds(projectIds: string[]) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config || projectIds.length === 0) {
    return new Map<string, ProjectAiReportRecord[]>();
  }

  try {
    const response = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      config.collections.projectAiReports,
      [
        Query.equal("project_id", projectIds),
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ],
    );
    const grouped = new Map<string, ProjectAiReportRecord[]>();

    for (const document of response.documents) {
      const report = mapProjectAiReportDocument(document);
      const reports = grouped.get(report.projectId) ?? [];
      reports.push(report);
      grouped.set(report.projectId, reports);
    }

    return grouped;
  } catch {
    return new Map<string, ProjectAiReportRecord[]>();
  }
}
