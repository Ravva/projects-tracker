import "server-only";

import { gunzipSync, gzipSync } from "node:zlib";

const MEMORY_BANK_MAX_LENGTHS = {
  projectBrief: 20_000,
  productContext: 12_000,
  activeContext: 12_000,
  progress: 12_000,
  docsReadme: 8_000,
} as const satisfies Record<keyof ProjectAiMemoryBankSnapshot, number>;

type ProjectAiMemoryBankSnapshot = {
  projectBrief: string;
  productContext: string;
  activeContext: string;
  progress: string;
  docsReadme: string;
};

type ProjectAiCompressedMemoryBankSnapshot = Partial<
  Record<keyof ProjectAiMemoryBankSnapshot, string>
>;

type TruncatedFields = Partial<
  Record<keyof ProjectAiMemoryBankSnapshot, boolean>
>;

export type ProjectProgressCalculationStatus =
  | "valid"
  | "missing_projectbrief"
  | "missing_deliverables_section"
  | "no_parsable_deliverables"
  | "invalid_weight_sum";

export type ProjectAiInputSnapshot = {
  name: string;
  summary: string;
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
    progressCalculationStatus: ProjectProgressCalculationStatus;
    progressCalculationDetails: string;
    deliverablesWeightTotal: number;
  };
  taskHighlights: {
    completed: string[];
    inProgress: string[];
    pending: string[];
  };
  memoryBank: ProjectAiMemoryBankSnapshot;
};

type LegacyProjectSnapshotPreview = Partial<
  Record<keyof ProjectAiMemoryBankSnapshot, string>
>;

function truncateText(value: string, maxLength: number) {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}\n\n[truncated: original ${trimmed.length} chars]`;
}

function compressText(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  return gzipSync(normalized).toString("base64");
}

function decompressText(value: string | undefined) {
  if (!value) {
    return "";
  }

  try {
    return gunzipSync(Buffer.from(value, "base64")).toString("utf8");
  } catch {
    return "";
  }
}

function buildCompressedMemoryBank(memoryBank: ProjectAiMemoryBankSnapshot): {
  compressed: ProjectAiCompressedMemoryBankSnapshot;
  truncatedFields: TruncatedFields;
} {
  const truncatedFields: TruncatedFields = {};

  const compressField = (
    key: keyof ProjectAiMemoryBankSnapshot,
    value: string,
  ) => {
    const maxLength = MEMORY_BANK_MAX_LENGTHS[key];
    const truncated = truncateText(value, maxLength);

    if (truncated.length !== value.trim().length) {
      truncatedFields[key] = true;
    }

    return compressText(truncated);
  };

  return {
    compressed: {
      projectBrief: compressField("projectBrief", memoryBank.projectBrief),
      productContext: compressField(
        "productContext",
        memoryBank.productContext,
      ),
      activeContext: compressField("activeContext", memoryBank.activeContext),
      progress: compressField("progress", memoryBank.progress),
      docsReadme: compressField("docsReadme", memoryBank.docsReadme),
    },
    truncatedFields,
  };
}

function buildLegacyMemoryBank(
  preview: LegacyProjectSnapshotPreview | undefined,
): ProjectAiMemoryBankSnapshot {
  return {
    projectBrief: preview?.projectBrief?.trim() ?? "",
    productContext: preview?.productContext?.trim() ?? "",
    activeContext: preview?.activeContext?.trim() ?? "",
    progress: preview?.progress?.trim() ?? "",
    docsReadme: preview?.docsReadme?.trim() ?? "",
  };
}

export type SerializedProjectAiSnapshot = {
  snapshotJson: string;
  truncatedFields: TruncatedFields;
};

export function serializeProjectAiInputSnapshot(
  snapshot: ProjectAiInputSnapshot,
): SerializedProjectAiSnapshot {
  const { compressed, truncatedFields } = buildCompressedMemoryBank(
    snapshot.memoryBank,
  );

  return {
    snapshotJson: JSON.stringify({
      ...snapshot,
      memoryBankCompressed: compressed,
      memoryBank: undefined,
    }),
    truncatedFields,
  };
}

export function parseProjectAiInputSnapshot(
  rawJson: string,
): ProjectAiInputSnapshot | null {
  try {
    const parsed = JSON.parse(rawJson) as Partial<ProjectAiInputSnapshot> & {
      memoryBankCompressed?: ProjectAiCompressedMemoryBankSnapshot;
      memoryBankPreview?: LegacyProjectSnapshotPreview;
    };

    const memoryBank =
      parsed.memoryBank &&
      typeof parsed.memoryBank === "object" &&
      !Array.isArray(parsed.memoryBank)
        ? {
            projectBrief: String(parsed.memoryBank.projectBrief ?? "").trim(),
            productContext: String(
              parsed.memoryBank.productContext ?? "",
            ).trim(),
            activeContext: String(parsed.memoryBank.activeContext ?? "").trim(),
            progress: String(parsed.memoryBank.progress ?? "").trim(),
            docsReadme: String(parsed.memoryBank.docsReadme ?? "").trim(),
          }
        : parsed.memoryBankCompressed
          ? {
              projectBrief: decompressText(
                parsed.memoryBankCompressed.projectBrief,
              ),
              productContext: decompressText(
                parsed.memoryBankCompressed.productContext,
              ),
              activeContext: decompressText(
                parsed.memoryBankCompressed.activeContext,
              ),
              progress: decompressText(parsed.memoryBankCompressed.progress),
              docsReadme: decompressText(
                parsed.memoryBankCompressed.docsReadme,
              ),
            }
          : buildLegacyMemoryBank(parsed.memoryBankPreview);

    return {
      name: String(parsed.name ?? ""),
      summary: String(parsed.summary ?? ""),
      github: {
        url: String(parsed.github?.url ?? ""),
        owner: String(parsed.github?.owner ?? ""),
        repo: String(parsed.github?.repo ?? ""),
        branch: String(parsed.github?.branch ?? ""),
        lastCommit: String(parsed.github?.lastCommit ?? ""),
        lastCommitSha: String(parsed.github?.lastCommitSha ?? ""),
        commitCount: Number(parsed.github?.commitCount ?? 0),
        commitsPerWeek: Number(parsed.github?.commitsPerWeek ?? 0),
        lastCommitDaysAgo:
          parsed.github?.lastCommitDaysAgo === null ||
          parsed.github?.lastCommitDaysAgo === undefined
            ? null
            : Number(parsed.github.lastCommitDaysAgo),
        isAbandoned: Boolean(parsed.github?.isAbandoned ?? false),
      },
      repositorySignals: {
        hasRepository: Boolean(
          parsed.repositorySignals?.hasRepository ?? false,
        ),
        hasMemoryBank: Boolean(
          parsed.repositorySignals?.hasMemoryBank ?? false,
        ),
        hasSpec: Boolean(parsed.repositorySignals?.hasSpec ?? false),
        hasPlan: Boolean(parsed.repositorySignals?.hasPlan ?? false),
        sourceFiles: Array.isArray(parsed.repositorySignals?.sourceFiles)
          ? parsed.repositorySignals.sourceFiles.map((item) => String(item))
          : [],
      },
      taskMetrics: {
        total: Number(parsed.taskMetrics?.total ?? 0),
        completed: Number(parsed.taskMetrics?.completed ?? 0),
        inProgress: Number(parsed.taskMetrics?.inProgress ?? 0),
        pending: Number(parsed.taskMetrics?.pending ?? 0),
        completionPercent: Number(parsed.taskMetrics?.completionPercent ?? 0),
        progressCalculationStatus:
          parsed.taskMetrics?.progressCalculationStatus === "valid" ||
          parsed.taskMetrics?.progressCalculationStatus ===
            "missing_projectbrief" ||
          parsed.taskMetrics?.progressCalculationStatus ===
            "missing_deliverables_section" ||
          parsed.taskMetrics?.progressCalculationStatus ===
            "no_parsable_deliverables" ||
          parsed.taskMetrics?.progressCalculationStatus === "invalid_weight_sum"
            ? parsed.taskMetrics.progressCalculationStatus
            : "missing_projectbrief",
        progressCalculationDetails: String(
          parsed.taskMetrics?.progressCalculationDetails ?? "",
        ),
        deliverablesWeightTotal: Number(
          parsed.taskMetrics?.deliverablesWeightTotal ?? 0,
        ),
      },
      taskHighlights: {
        completed: Array.isArray(parsed.taskHighlights?.completed)
          ? parsed.taskHighlights.completed.map((item) => String(item))
          : [],
        inProgress: Array.isArray(parsed.taskHighlights?.inProgress)
          ? parsed.taskHighlights.inProgress.map((item) => String(item))
          : [],
        pending: Array.isArray(parsed.taskHighlights?.pending)
          ? parsed.taskHighlights.pending.map((item) => String(item))
          : [],
      },
      memoryBank,
    };
  } catch {
    return null;
  }
}
