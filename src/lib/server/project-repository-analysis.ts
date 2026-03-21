import "server-only";

import {
  getGithubRepositoryFileText,
  getGithubRepositoryMetadata,
  listGithubRepositoryCommits,
} from "@/lib/server/github";

type DeliverableStatus = "completed" | "in_progress" | "pending" | "blocked";

type ParsedDeliverable = {
  id: string;
  title: string;
  status: DeliverableStatus;
  weight: number;
};

type ProgressCalculationStatus =
  | "valid"
  | "missing_projectbrief"
  | "missing_deliverables_section"
  | "no_parsable_deliverables"
  | "invalid_weight_sum";

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
    progressCalculationStatus: ProgressCalculationStatus;
    progressCalculationDetails: string;
    deliverablesWeightTotal: number;
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

function normalizeDeliverableStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  const statusMatch = normalized.match(
    /\b(completed|in_progress|pending|blocked)\b/,
  );

  if (!statusMatch) {
    return null;
  }

  if (
    statusMatch[1] === "completed" ||
    statusMatch[1] === "in_progress" ||
    statusMatch[1] === "pending" ||
    statusMatch[1] === "blocked"
  ) {
    return statusMatch[1];
  }

  return null;
}

function parseDeliverableTableRow(line: string): ParsedDeliverable | null {
  const trimmed = line.trim();

  if (!trimmed.startsWith("|")) {
    return null;
  }

  const columns = trimmed
    .split("|")
    .slice(1, -1)
    .map((column) => column.trim());

  if (columns.length < 4) {
    return null;
  }

  if (
    columns.every((column) => /^:?-{3,}:?$/.test(column)) ||
    columns[0].toLowerCase() === "id"
  ) {
    return null;
  }

  const status = normalizeDeliverableStatus(columns[2]);
  const weight = Number(columns[3].replace("%", "").trim());

  if (!columns[0] || !columns[1] || !status || !Number.isFinite(weight)) {
    return null;
  }

  return {
    id: columns[0],
    title: columns[1],
    status,
    weight,
  };
}

function parseDeliverableBullet(line: string): ParsedDeliverable | null {
  const trimmed = line.trim();

  if (!/^\s*-\s+/.test(trimmed)) {
    return null;
  }

  const content = trimmed.replace(/^\s*-\s+/, "");
  const idMatch = content.match(/(?:^|\|)\s*id\s*:\s*([^|]+?)(?=\s*\||$)/i);
  const titleMatch = content.match(
    /(?:^|\|)\s*(?:title|deliverable|name)\s*:\s*([^|]+?)(?=\s*\||$)/i,
  );
  const statusMatch = content.match(
    /(?:^|\|)\s*status\s*:\s*([^|]+?)(?=\s*\||$)/i,
  );
  const weightMatch = content.match(
    /(?:^|\|)\s*weight\s*:\s*([^|]+?)(?=\s*\||$)/i,
  );
  const status = normalizeDeliverableStatus(statusMatch?.[1] ?? "");
  const weight = Number((weightMatch?.[1] ?? "").replace("%", "").trim());

  if (
    !idMatch?.[1]?.trim() ||
    !titleMatch?.[1]?.trim() ||
    !status ||
    !Number.isFinite(weight)
  ) {
    return null;
  }

  return {
    id: idMatch[1].trim(),
    title: titleMatch[1].trim(),
    status,
    weight,
  };
}

export function parseProjectDeliverables(content: string | null) {
  const section = extractMarkdownSection(content, "Project Deliverables");
  const lines = section.split(/\r?\n/);
  const deliverables: ParsedDeliverable[] = [];

  for (const line of lines) {
    const parsed =
      parseDeliverableTableRow(line) ?? parseDeliverableBullet(line);

    if (parsed) {
      deliverables.push(parsed);
    }
  }

  const totalWeight = deliverables.reduce(
    (sum, deliverable) => sum + deliverable.weight,
    0,
  );
  const hasValidWeights = totalWeight === 100;

  return {
    hasSection: section.length > 0,
    deliverables,
    hasValidWeights,
    totalWeight,
  };
}

function buildProgressCalculationDiagnostics(input: {
  projectBrief: string | null;
  parsedDeliverables: ReturnType<typeof parseProjectDeliverables>;
}) {
  if (!input.projectBrief) {
    return {
      status: "missing_projectbrief" as const,
      details: "Файл memory_bank/projectbrief.md не найден в репозитории.",
    };
  }

  if (!input.parsedDeliverables.hasSection) {
    return {
      status: "missing_deliverables_section" as const,
      details:
        "В memory_bank/projectbrief.md отсутствует секция ## Project Deliverables.",
    };
  }

  if (input.parsedDeliverables.deliverables.length === 0) {
    return {
      status: "no_parsable_deliverables" as const,
      details:
        "Секция ## Project Deliverables найдена, но в ней нет валидных строк таблицы формата ID | Deliverable | Status | Weight.",
    };
  }

  if (!input.parsedDeliverables.hasValidWeights) {
    return {
      status: "invalid_weight_sum" as const,
      details: `Сумма Weight в ## Project Deliverables равна ${input.parsedDeliverables.totalWeight}, а должна быть ровно 100.`,
    };
  }

  return {
    status: "valid" as const,
    details:
      "Project Deliverables валиден: секция найдена, строки распарсились, сумма весов равна 100.",
  };
}

function limitDeliverableHighlights(
  deliverables: ParsedDeliverable[],
  statuses: DeliverableStatus[],
  limit = 5,
) {
  return deliverables
    .filter((deliverable) => statuses.includes(deliverable.status))
    .slice(0, limit)
    .map(
      (deliverable) =>
        `${deliverable.id}: ${deliverable.title} (${deliverable.weight}%)`,
    );
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
  const parsedDeliverables = parseProjectDeliverables(projectBrief);
  const progressCalculation = buildProgressCalculationDiagnostics({
    projectBrief,
    parsedDeliverables,
  });
  const deliverables =
    progressCalculation.status === "valid" &&
    parsedDeliverables.deliverables.length > 0
      ? parsedDeliverables.deliverables
      : [];
  const trackedTasksCompleted = deliverables.filter(
    (deliverable) => deliverable.status === "completed",
  ).length;
  const trackedTasksInProgress = deliverables.filter(
    (deliverable) => deliverable.status === "in_progress",
  ).length;
  const trackedTasksPending = deliverables.filter(
    (deliverable) =>
      deliverable.status === "pending" || deliverable.status === "blocked",
  ).length;
  const trackedTasksTotal = deliverables.length;
  const completionPercent = deliverables.reduce((sum, deliverable) => {
    return deliverable.status === "completed" ? sum + deliverable.weight : sum;
  }, 0);
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
        progressCalculation.status === "valid" &&
        deliverables.length > 0 &&
        hasMeaningfulMarkdown(activeContext) &&
        hasMeaningfulMarkdown(progress),
      trackedTasksTotal,
      trackedTasksCompleted,
      trackedTasksInProgress,
      trackedTasksPending,
      completionPercent,
      progressCalculationStatus: progressCalculation.status,
      progressCalculationDetails: progressCalculation.details,
      deliverablesWeightTotal: parsedDeliverables.totalWeight,
      commitCount: commits.length,
      commitsPerWeek,
      lastCommitAt: lastCommit?.committedAt ?? "",
      lastCommitSha: lastCommit?.sha ?? "",
      lastCommitDaysAgo,
      isAbandoned: lastCommitDaysAgo === null ? true : lastCommitDaysAgo > 7,
    },
    taskHighlights: {
      completed: limitDeliverableHighlights(deliverables, ["completed"]),
      inProgress: limitDeliverableHighlights(deliverables, ["in_progress"]),
      pending: limitDeliverableHighlights(deliverables, ["pending", "blocked"]),
    },
  };
}
