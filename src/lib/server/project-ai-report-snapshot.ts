import "server-only";

import { gunzipSync, gzipSync } from "node:zlib";

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

function buildCompressedMemoryBank(
  memoryBank: ProjectAiMemoryBankSnapshot,
): ProjectAiCompressedMemoryBankSnapshot {
  return {
    projectBrief: compressText(memoryBank.projectBrief),
    productContext: compressText(memoryBank.productContext),
    activeContext: compressText(memoryBank.activeContext),
    progress: compressText(memoryBank.progress),
    docsReadme: compressText(memoryBank.docsReadme),
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

export function serializeProjectAiInputSnapshot(
  snapshot: ProjectAiInputSnapshot,
) {
  return JSON.stringify({
    ...snapshot,
    memoryBankCompressed: buildCompressedMemoryBank(snapshot.memoryBank),
    memoryBank: undefined,
  });
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
