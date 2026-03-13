import "server-only";

import {
  getGithubRepositoryFileText,
  getGithubRepositoryMetadata,
  listGithubRepositoryCommits,
} from "@/lib/server/github";

type TaskStatus = "completed" | "in_progress" | "pending";

type ParsedTask = {
  status: TaskStatus;
  text: string;
  normalizedText: string;
  source: string;
};

type RepositoryFileSnapshot = {
  path: string;
  content: string;
};

export type ProjectRepositoryAnalysis = {
  repository: {
    owner: string;
    repo: string;
    defaultBranch: string;
    htmlUrl: string;
    isPrivate: boolean;
    hasRepository: boolean;
    sourceFiles: string[];
  };
  files: {
    projectBrief: RepositoryFileSnapshot | null;
    productContext: RepositoryFileSnapshot | null;
    activeContext: RepositoryFileSnapshot | null;
    progress: RepositoryFileSnapshot | null;
    docsReadme: RepositoryFileSnapshot | null;
  };
  metrics: {
    hasMemoryBank: boolean;
    hasSpec: boolean;
    hasPlan: boolean;
    trackedTasksTotal: number;
    trackedTasksCompleted: number;
    trackedTasksInProgress: number;
    trackedTasksPending: number;
    completionPercent: number;
    commitCount: number;
    commitsPerWeek: number;
    lastCommitAt: string;
    lastCommitSha: string;
    lastCommitDaysAgo: number | null;
    isAbandoned: boolean;
  };
  taskHighlights: {
    completed: string[];
    inProgress: string[];
    pending: string[];
  };
};

function trimMarkdownNoise(content: string) {
  return content
    .replace(/^---[\s\S]*?---/, "")
    .replace(/^#.+$/gm, "")
    .replace(/[`>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasMeaningfulMarkdown(content: string | null) {
  if (!content) {
    return false;
  }

  return trimMarkdownNoise(content).length >= 20;
}

function extractMarkdownSection(content: string | null, heading: string) {
  if (!content) {
    return "";
  }

  const lines = content.split(/\r?\n/);
  const normalizedHeading = heading.trim().toLowerCase();
  const collected: string[] = [];
  let isInsideSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^##\s+/.test(trimmed)) {
      const currentHeading = trimmed
        .replace(/^##\s+/, "")
        .trim()
        .toLowerCase();

      if (isInsideSection) {
        break;
      }

      if (currentHeading === normalizedHeading) {
        isInsideSection = true;
      }

      continue;
    }

    if (isInsideSection) {
      collected.push(line);
    }
  }

  return collected.join("\n").trim();
}

function extractMarkdownBullets(sectionContent: string) {
  if (!sectionContent.trim()) {
    return [];
  }

  const lines = sectionContent.split(/\r?\n/);
  const bullets: string[] = [];
  let currentBullet = "";

  const flushCurrentBullet = () => {
    if (currentBullet.trim()) {
      bullets.push(currentBullet.trim());
      currentBullet = "";
    }
  };

  for (const line of lines) {
    if (/^\s*(?:-|\d+\.)\s+/.test(line)) {
      flushCurrentBullet();
      currentBullet = line.replace(/^\s*(?:-|\d+\.)\s+/, "").trim();
      continue;
    }

    if (currentBullet && /^\s{2,}\S+/.test(line)) {
      currentBullet = `${currentBullet} ${line.trim()}`;
      continue;
    }

    flushCurrentBullet();
  }

  flushCurrentBullet();

  return bullets;
}

function normalizeTaskText(text: string) {
  return text
    .toLowerCase()
    .replace(/^\d{4}-\d{2}-\d{2}:\s*/, "")
    .replace(/^закрыто в текущей сессии:\s*/, "")
    .replace(/^в работе:\s*/, "")
    .replace(/^следующим этапом после текущей правки остается\s*/, "")
    .replace(/^следующий этап:\s*/, "")
    .replace(/^закрыто:\s*/, "")
    .replace(/^выполнено:\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyActiveContextTask(text: string): TaskStatus {
  const normalized = text.toLowerCase();

  if (
    normalized.includes("закрыто") ||
    normalized.includes("выполнено") ||
    normalized.includes("заверш")
  ) {
    return "completed";
  }

  if (
    normalized.includes("в работе") ||
    normalized.includes("начат") ||
    normalized.includes("начата")
  ) {
    return "in_progress";
  }

  return "pending";
}

function parseTasksFromActiveContext(content: string | null): ParsedTask[] {
  const section = extractMarkdownSection(content, "Задача в работе");

  return extractMarkdownBullets(section)
    .map((text) => ({
      status: classifyActiveContextTask(text),
      text,
      normalizedText: normalizeTaskText(text),
      source: "memory_bank/activeContext.md",
    }))
    .filter((task) => Boolean(task.normalizedText));
}

function parseTasksFromProgress(content: string | null): ParsedTask[] {
  const changelog = extractMarkdownSection(content, "Changelog");

  return extractMarkdownBullets(changelog)
    .map((text) => ({
      status: "completed" as const,
      text,
      normalizedText: normalizeTaskText(text),
      source: "memory_bank/progress.md",
    }))
    .filter((task) => Boolean(task.normalizedText));
}

function dedupeTasks(tasks: ParsedTask[]) {
  const statusRank: Record<TaskStatus, number> = {
    pending: 0,
    in_progress: 1,
    completed: 2,
  };
  const taskMap = new Map<string, ParsedTask>();

  for (const task of tasks) {
    const existing = taskMap.get(task.normalizedText);

    if (!existing || statusRank[task.status] > statusRank[existing.status]) {
      taskMap.set(task.normalizedText, task);
    }
  }

  return [...taskMap.values()];
}

function limitTaskHighlights(
  tasks: ParsedTask[],
  status: TaskStatus,
  limit = 5,
) {
  return tasks
    .filter((task) => task.status === status)
    .slice(0, limit)
    .map((task) => task.text);
}

function daysSinceIsoDate(isoDate: string) {
  const parsed = new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - parsed.getTime()) / (24 * 60 * 60 * 1000));
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export async function analyzeProjectRepository(input: {
  owner: string;
  repo: string;
}): Promise<ProjectRepositoryAnalysis> {
  const metadata = await getGithubRepositoryMetadata(input.owner, input.repo);
  const defaultBranch = metadata.defaultBranch;

  const [
    projectBrief,
    productContext,
    activeContext,
    progress,
    docsReadme,
    commits,
  ] = await Promise.all([
    getGithubRepositoryFileText(
      input.owner,
      input.repo,
      "memory_bank/projectbrief.md",
      defaultBranch,
    ),
    getGithubRepositoryFileText(
      input.owner,
      input.repo,
      "memory_bank/productContext.md",
      defaultBranch,
    ),
    getGithubRepositoryFileText(
      input.owner,
      input.repo,
      "memory_bank/activeContext.md",
      defaultBranch,
    ),
    getGithubRepositoryFileText(
      input.owner,
      input.repo,
      "memory_bank/progress.md",
      defaultBranch,
    ),
    getGithubRepositoryFileText(
      input.owner,
      input.repo,
      "docs/README.md",
      defaultBranch,
    ),
    listGithubRepositoryCommits(input.owner, input.repo, defaultBranch),
  ]);

  const sourceFiles = [
    projectBrief ? "memory_bank/projectbrief.md" : null,
    productContext ? "memory_bank/productContext.md" : null,
    activeContext ? "memory_bank/activeContext.md" : null,
    progress ? "memory_bank/progress.md" : null,
    docsReadme ? "docs/README.md" : null,
  ].filter((path): path is string => Boolean(path));

  const tasks = dedupeTasks([
    ...parseTasksFromActiveContext(activeContext),
    ...parseTasksFromProgress(progress),
  ]);
  const trackedTasksCompleted = tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const trackedTasksInProgress = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const trackedTasksPending = tasks.filter(
    (task) => task.status === "pending",
  ).length;
  const trackedTasksTotal = tasks.length;
  const completionPercent =
    trackedTasksTotal === 0
      ? 0
      : Math.round((trackedTasksCompleted / trackedTasksTotal) * 100);
  const lastCommit = commits[0];
  const oldestCommit = commits.at(-1);
  const sampleWindowDays = oldestCommit
    ? Math.max(
        1,
        Math.ceil(
          (Date.now() - new Date(oldestCommit.committedAt).getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      )
    : 0;
  const commitsPerWeek =
    commits.length === 0
      ? 0
      : roundToSingleDecimal((commits.length / sampleWindowDays) * 7);
  const lastCommitDaysAgo = lastCommit
    ? daysSinceIsoDate(lastCommit.committedAt)
    : null;

  return {
    repository: {
      owner: input.owner,
      repo: input.repo,
      defaultBranch,
      htmlUrl: metadata.htmlUrl,
      isPrivate: metadata.private,
      hasRepository: true,
      sourceFiles,
    },
    files: {
      projectBrief: projectBrief
        ? { path: "memory_bank/projectbrief.md", content: projectBrief }
        : null,
      productContext: productContext
        ? { path: "memory_bank/productContext.md", content: productContext }
        : null,
      activeContext: activeContext
        ? { path: "memory_bank/activeContext.md", content: activeContext }
        : null,
      progress: progress
        ? { path: "memory_bank/progress.md", content: progress }
        : null,
      docsReadme: docsReadme
        ? { path: "docs/README.md", content: docsReadme }
        : null,
    },
    metrics: {
      hasMemoryBank: Boolean(
        projectBrief || productContext || activeContext || progress,
      ),
      hasSpec:
        hasMeaningfulMarkdown(projectBrief) &&
        hasMeaningfulMarkdown(productContext),
      hasPlan:
        hasMeaningfulMarkdown(activeContext) && hasMeaningfulMarkdown(progress),
      trackedTasksTotal,
      trackedTasksCompleted,
      trackedTasksInProgress,
      trackedTasksPending,
      completionPercent,
      commitCount: commits.length,
      commitsPerWeek,
      lastCommitAt: lastCommit?.committedAt ?? "",
      lastCommitSha: lastCommit?.sha ?? "",
      lastCommitDaysAgo,
      isAbandoned: lastCommitDaysAgo === null ? true : lastCommitDaysAgo > 7,
    },
    taskHighlights: {
      completed: limitTaskHighlights(tasks, "completed"),
      inProgress: limitTaskHighlights(tasks, "in_progress"),
      pending: limitTaskHighlights(tasks, "pending"),
    },
  };
}
