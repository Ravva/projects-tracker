import type { ProjectInput } from "@/lib/types";

export const PROJECT_FIELD_LIMITS = {
  name: 255,
  summary: 2000,
  githubUrl: 1000,
  specMarkdown: 4000,
  planMarkdown: 4000,
} as const;

export const PROJECT_STATE_LIMITS = {
  primaryRisk: 64,
  riskFlags: 6,
  manualOverrideNote: 400,
  aiSummary: 600,
  nextSteps: 5,
  nextStepItem: 120,
} as const;

function trimToLimit(value: string, limit: number) {
  return value.slice(0, limit);
}

export function normalizeProjectInput(input: ProjectInput): ProjectInput {
  return {
    studentId: input.studentId,
    name: trimToLimit(input.name, PROJECT_FIELD_LIMITS.name),
    summary: trimToLimit(input.summary, PROJECT_FIELD_LIMITS.summary),
    githubUrl: trimToLimit(input.githubUrl, PROJECT_FIELD_LIMITS.githubUrl),
    status: input.status,
    specMarkdown: trimToLimit(
      input.specMarkdown,
      PROJECT_FIELD_LIMITS.specMarkdown,
    ),
    planMarkdown: trimToLimit(
      input.planMarkdown,
      PROJECT_FIELD_LIMITS.planMarkdown,
    ),
  };
}

export function normalizeProjectState(input: {
  primaryRisk?: string;
  riskFlags?: string[];
  aiCompletionPercent?: number;
  manualCompletionPercent?: number | null;
  manualOverrideEnabled?: boolean;
  manualOverrideNote?: string;
  lastAiAnalysisAt?: string;
  aiSummary?: string;
  nextSteps?: string[];
  hasRepository?: boolean;
  hasMemoryBank?: boolean;
  hasSpec?: boolean;
  hasPlan?: boolean;
  trackedTasksTotal?: number;
  trackedTasksCompleted?: number;
  trackedTasksInProgress?: number;
  trackedTasksPending?: number;
  commitCount?: number;
  commitsPerWeek?: number;
  lastCommitDaysAgo?: number | null;
  isAbandoned?: boolean;
}) {
  return {
    primaryRisk: trimToLimit(
      input.primaryRisk ?? "healthy",
      PROJECT_STATE_LIMITS.primaryRisk,
    ),
    riskFlags: (input.riskFlags ?? []).slice(0, PROJECT_STATE_LIMITS.riskFlags),
    aiCompletionPercent: input.aiCompletionPercent ?? 0,
    manualCompletionPercent: input.manualCompletionPercent ?? null,
    manualOverrideEnabled: input.manualOverrideEnabled ?? false,
    manualOverrideNote: trimToLimit(
      input.manualOverrideNote ?? "",
      PROJECT_STATE_LIMITS.manualOverrideNote,
    ),
    lastAiAnalysisAt: input.lastAiAnalysisAt ?? "",
    aiSummary: trimToLimit(
      input.aiSummary ?? "",
      PROJECT_STATE_LIMITS.aiSummary,
    ),
    nextSteps: (input.nextSteps ?? [])
      .slice(0, PROJECT_STATE_LIMITS.nextSteps)
      .map((step) => trimToLimit(step, PROJECT_STATE_LIMITS.nextStepItem)),
    hasRepository: input.hasRepository ?? false,
    hasMemoryBank: input.hasMemoryBank ?? false,
    hasSpec: input.hasSpec ?? false,
    hasPlan: input.hasPlan ?? false,
    trackedTasksTotal: input.trackedTasksTotal ?? 0,
    trackedTasksCompleted: input.trackedTasksCompleted ?? 0,
    trackedTasksInProgress: input.trackedTasksInProgress ?? 0,
    trackedTasksPending: input.trackedTasksPending ?? 0,
    commitCount: input.commitCount ?? 0,
    commitsPerWeek: input.commitsPerWeek ?? 0,
    lastCommitDaysAgo: input.lastCommitDaysAgo ?? null,
    isAbandoned: input.isAbandoned ?? false,
  };
}
