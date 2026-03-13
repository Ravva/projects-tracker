import "server-only";

import { ID, Query } from "node-appwrite";
import {
  normalizeProjectInput,
  normalizeProjectState,
} from "@/lib/project-limits";
import { getAppwriteConfig, getAppwriteDatabases } from "@/lib/server/appwrite";
import {
  getGithubRepositoryMetadata,
  listGithubRepositoryCommits,
} from "@/lib/server/github";
import {
  mapProjectAiReportDocument,
  mapProjectDocument,
} from "@/lib/server/mappers";
import { getOpenAiModel, requestOpenAiJsonObject } from "@/lib/server/openai";
import { analyzeProjectRepository } from "@/lib/server/project-repository-analysis";
import { listStudentNameMap } from "@/lib/server/repositories/students";
import type {
  ProjectAiReportRecord,
  ProjectInput,
  ProjectRecord,
  ProjectRisk,
} from "@/lib/types";

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

function primaryRiskFromFlags(flags: ProjectRisk[]) {
  if (flags.includes("invalid_github_repo")) {
    return "invalid_github_repo";
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

  if (flags.includes("abandoned") || flags.includes("stale_repo")) {
    return "abandoned";
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
        risk: primaryRiskFromFlags(riskFlags),
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
        risk: primaryRiskFromFlags(riskFlags),
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
      risk: primaryRiskFromFlags(riskFlags),
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

  const existingProjects = await listProjectsByStudentId(input.studentId);

  if (
    existingProjects.some(
      (project) => project.githubUrl.trim() === normalizedUrl,
    )
  ) {
    throw new Error("Этот репозиторий уже выбран для текущего ученика.");
  }

  return appwrite.databases.createDocument(
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
        primaryRisk: primaryRiskFromFlags(flags),
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
          primaryRisk: primaryRiskFromFlags(riskFlags),
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
  } catch {
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

  const openAiModel = getOpenAiModel();
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
  } catch {
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
  const inputSnapshot = {
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
  const parsed = await requestOpenAiJsonObject<{
    summary?: string;
    risks?: string[];
    next_steps?: string[];
    implemented_items?: string[];
    partial_items?: string[];
    missing_items?: string[];
  }>({
    model: openAiModel,
    systemPrompt:
      "Ты оцениваешь учебный GitHub-проект по данным memory_bank и метрикам GitHub. Анализ проводится исключительно в образовательных целях. Процент реализации уже рассчитан детерминированно и его нельзя менять. Верни строго JSON с полями summary, risks, next_steps, implemented_items, partial_items, missing_items. Summary должен кратко объяснять текущее состояние проекта, опираясь на готовые метрики и содержимое memory_bank.",
    userPayload: inputSnapshot,
  });
  const risks = Array.isArray(parsed.risks) ? parsed.risks : [];
  const nextSteps = Array.isArray(parsed.next_steps) ? parsed.next_steps : [];

  await appwrite.databases.createDocument(
    appwrite.databaseId,
    config.collections.projectAiReports,
    ID.unique(),
    {
      project_id: projectId,
      source_commit_sha: repositoryAnalysis.metrics.lastCommitSha,
      analysis_version: "v2-memory-bank",
      model_name: openAiModel,
      summary: parsed.summary ?? "",
      completion_percent: completionPercent,
      report_payload_json: JSON.stringify({
        inputSnapshotJson: JSON.stringify(inputSnapshot),
        implementedItems: parsed.implemented_items ?? [],
        partialItems: parsed.partial_items ?? [],
        missingItems: parsed.missing_items ?? [],
        risks,
        nextSteps,
        sourceFiles: repositoryAnalysis.repository.sourceFiles,
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

  await appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.projects,
    projectId,
    {
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
        primaryRisk: primaryRiskFromFlags(nextRiskFlags),
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
