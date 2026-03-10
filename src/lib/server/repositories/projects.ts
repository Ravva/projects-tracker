import "server-only";

import { ID, Query } from "node-appwrite";
import { normalizeProjectInput } from "@/lib/project-limits";
import { getAppwriteConfig, getAppwriteDatabases } from "@/lib/server/appwrite";
import { daysSince } from "@/lib/server/date-utils";
import {
  mapProjectAiReportDocument,
  mapProjectDocument,
} from "@/lib/server/mappers";
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
    riskFlags: ProjectRisk[];
    aiCompletionPercent: number;
    manualCompletionPercent: number | null;
    manualOverrideEnabled: boolean;
    manualOverrideNote: string;
    lastAiAnalysisAt: string;
    aiSummary: string;
    nextSteps: string[];
  }> = {},
) {
  return JSON.stringify({
    primaryRisk: input.primaryRisk ?? "healthy",
    riskFlags: input.riskFlags ?? [],
    aiCompletionPercent: input.aiCompletionPercent ?? 0,
    manualCompletionPercent: input.manualCompletionPercent ?? null,
    manualOverrideEnabled: input.manualOverrideEnabled ?? false,
    manualOverrideNote: input.manualOverrideNote ?? "",
    lastAiAnalysisAt: input.lastAiAnalysisAt ?? "",
    aiSummary: input.aiSummary ?? "",
    nextSteps: input.nextSteps ?? [],
  });
}

function normalizeProjectRiskFlags(project: ProjectRecord) {
  const flags = new Set<ProjectRisk>();

  if (!project.specMarkdown.trim()) {
    flags.add("missing_spec");
  }

  if (!project.planMarkdown.trim()) {
    flags.add("missing_plan");
  }

  if (project.progress < 25) {
    flags.add("low_progress");
  }

  if (daysSince(project.lastCommit) >= 7) {
    flags.add("stale_repo");
  }

  for (const flag of project.riskFlags) {
    flags.add(flag);
  }

  return [...flags];
}

function primaryRiskFromFlags(flags: ProjectRisk[]) {
  if (flags.includes("invalid_github_repo")) {
    return "invalid_github_repo";
  }

  if (flags.includes("low_progress")) {
    return "low_progress";
  }

  if (flags.includes("stale_repo")) {
    return "stale_repo";
  }

  if (flags.includes("missing_spec")) {
    return "missing_spec";
  }

  if (flags.includes("missing_plan")) {
    return "missing_plan";
  }

  return "healthy";
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

function buildGithubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "projects-tracker",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
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
      project_state_json: buildProjectState({
        primaryRisk: primaryRiskFromFlags(flags),
        riskFlags: flags,
        aiCompletionPercent: project.aiCompletionPercent,
        manualCompletionPercent: project.manualCompletionPercent,
        manualOverrideEnabled: project.manualOverrideEnabled,
        manualOverrideNote: project.manualOverrideNote,
        lastAiAnalysisAt:
          project.lastAiAnalysisAt === "Нет данных"
            ? ""
            : project.lastAiAnalysisAt,
        aiSummary: project.aiSummary,
        nextSteps: project.nextSteps,
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
    const repoResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`,
      { headers: buildGithubHeaders() },
    );

    if (!repoResponse.ok) {
      throw new Error(`GitHub repo request failed with ${repoResponse.status}`);
    }

    const repoData = (await repoResponse.json()) as {
      default_branch: string;
      private: boolean;
      html_url: string;
    };
    const commitResponse = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=1&sha=${repoData.default_branch}`,
      { headers: buildGithubHeaders() },
    );

    if (!commitResponse.ok) {
      throw new Error(
        `GitHub commit request failed with ${commitResponse.status}`,
      );
    }

    const commitData = (await commitResponse.json()) as Array<{
      sha: string;
      commit: { author: { date: string } };
    }>;
    const lastCommit = commitData[0];
    const riskFlags = normalizeProjectRiskFlags({
      ...project,
      githubOwner: parsed.owner,
      githubRepo: parsed.repo,
      defaultBranch: repoData.default_branch,
      lastCommit: lastCommit?.commit.author.date ?? "",
      lastCommitSha: lastCommit?.sha ?? "",
      lastSyncAt: new Date().toISOString(),
      riskFlags: project.riskFlags.filter(
        (flag) => flag !== "invalid_github_repo",
      ),
    });

    await appwrite.databases.updateDocument(
      appwrite.databaseId,
      config.collections.projects,
      projectId,
      {
        github_url: repoData.html_url,
        github_state_json: buildGithubState({
          owner: parsed.owner,
          repo: parsed.repo,
          defaultBranch: repoData.default_branch,
          lastCommitAt: lastCommit?.commit.author.date ?? "",
          lastCommitSha: lastCommit?.sha ?? "",
          lastSyncAt: new Date().toISOString(),
        }),
        project_state_json: buildProjectState({
          primaryRisk: primaryRiskFromFlags(riskFlags),
          riskFlags,
          aiCompletionPercent: project.aiCompletionPercent,
          manualCompletionPercent: project.manualCompletionPercent,
          manualOverrideEnabled: project.manualOverrideEnabled,
          manualOverrideNote: project.manualOverrideNote,
          lastAiAnalysisAt:
            project.lastAiAnalysisAt === "Нет данных"
              ? ""
              : project.lastAiAnalysisAt,
          aiSummary: project.aiSummary,
          nextSteps: project.nextSteps,
        }),
      },
    );
  } catch {
    await updateProjectRiskFlags(projectId, ["invalid_github_repo"]);
    throw new Error("Не удалось синхронизировать GitHub-репозиторий.");
  }
}

function requireOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-5-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY не задан.");
  }

  return { apiKey, model };
}

export async function runProjectAiAnalysis(projectId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const project = await getProject(projectId);

  if (!appwrite || !config || !project) {
    throw new Error("Проект не найден.");
  }

  if (!project.specMarkdown.trim() || !project.planMarkdown.trim()) {
    throw new Error("AI-анализ запрещен без ТЗ и плана.");
  }

  const openAi = requireOpenAiConfig();
  const inputSnapshot = {
    name: project.name,
    summary: project.summary,
    github: {
      url: project.githubUrl,
      owner: project.githubOwner,
      repo: project.githubRepo,
      branch: project.defaultBranch,
      lastCommit: project.lastCommit,
      lastCommitSha: project.lastCommitSha,
    },
    specMarkdown: project.specMarkdown,
    planMarkdown: project.planMarkdown,
  };
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAi.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openAi.model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "Ты оцениваешь учебный GitHub-проект. Верни строго JSON с полями summary, completion_percent, risks, next_steps, implemented_items, partial_items, missing_items.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(inputSnapshot),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("OpenAI API вернул ошибку.");
  }

  const responseJson = (await response.json()) as {
    output_text?: string;
  };
  const parsed = JSON.parse(responseJson.output_text ?? "{}") as {
    summary?: string;
    completion_percent?: number;
    risks?: string[];
    next_steps?: string[];
    implemented_items?: string[];
    partial_items?: string[];
    missing_items?: string[];
  };
  const completionPercent = Number(parsed.completion_percent ?? 0);
  const risks = Array.isArray(parsed.risks) ? parsed.risks : [];
  const nextSteps = Array.isArray(parsed.next_steps) ? parsed.next_steps : [];
  const riskFlags = normalizeProjectRiskFlags({
    ...project,
    aiSummary: parsed.summary ?? "",
    aiCompletionPercent: completionPercent,
    progress: completionPercent,
    riskFlags: risks.includes("invalid_github_repo")
      ? ["invalid_github_repo"]
      : project.riskFlags.filter((flag) => flag !== "invalid_github_repo"),
  });

  await appwrite.databases.createDocument(
    appwrite.databaseId,
    config.collections.projectAiReports,
    ID.unique(),
    {
      project_id: projectId,
      source_commit_sha: project.lastCommitSha,
      analysis_version: "v1",
      model_name: openAi.model,
      summary: parsed.summary ?? "",
      completion_percent: completionPercent,
      report_payload_json: JSON.stringify({
        inputSnapshotJson: JSON.stringify(inputSnapshot),
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
      project_state_json: buildProjectState({
        primaryRisk: primaryRiskFromFlags(riskFlags),
        riskFlags,
        aiCompletionPercent: completionPercent,
        manualCompletionPercent: project.manualCompletionPercent,
        manualOverrideEnabled: false,
        manualOverrideNote: project.manualOverrideNote,
        lastAiAnalysisAt: new Date().toISOString(),
        aiSummary: parsed.summary ?? "",
        nextSteps,
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
      project_state_json: buildProjectState({
        primaryRisk: project.risk,
        riskFlags: project.riskFlags,
        aiCompletionPercent: project.aiCompletionPercent,
        manualCompletionPercent: percent,
        manualOverrideEnabled: true,
        manualOverrideNote: note,
        lastAiAnalysisAt:
          project.lastAiAnalysisAt === "Нет данных"
            ? ""
            : project.lastAiAnalysisAt,
        aiSummary: project.aiSummary,
        nextSteps: project.nextSteps,
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
      project_state_json: buildProjectState({
        primaryRisk: project.risk,
        riskFlags: project.riskFlags,
        aiCompletionPercent: project.aiCompletionPercent,
        manualCompletionPercent: project.manualCompletionPercent,
        manualOverrideEnabled: false,
        manualOverrideNote: "",
        lastAiAnalysisAt:
          project.lastAiAnalysisAt === "Нет данных"
            ? ""
            : project.lastAiAnalysisAt,
        aiSummary: project.aiSummary,
        nextSteps: project.nextSteps,
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
