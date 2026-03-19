import type {
  ProjectAiStatus,
  ProjectRecord,
  ProjectSyncStatus,
} from "@/lib/types";

type ProjectStatusTone = "critical" | "warning" | "success" | "calm";

const PROJECT_SYNC_LABELS: Record<ProjectSyncStatus, string> = {
  unknown: "нет sync-данных",
  synced: "repo актуален",
  sync_needed: "нужен sync",
  unavailable: "GitHub недоступен",
};

const PROJECT_AI_LABELS: Record<ProjectAiStatus, string> = {
  not_started: "AI не запускался",
  up_to_date: "AI актуален",
  outdated: "AI устарел",
  status_unknown: "AI статус не проверен",
};

export function getProjectSyncStatusLabel(status: ProjectSyncStatus) {
  return PROJECT_SYNC_LABELS[status];
}

export function getProjectSyncStatusTone(
  status: ProjectSyncStatus,
): ProjectStatusTone {
  if (status === "synced") {
    return "success";
  }

  if (status === "sync_needed") {
    return "warning";
  }

  if (status === "unavailable") {
    return "critical";
  }

  return "calm";
}

export function getProjectAiStatusLabel(status: ProjectAiStatus) {
  return PROJECT_AI_LABELS[status];
}

export function getProjectAiStatusTone(
  status: ProjectAiStatus,
): ProjectStatusTone {
  if (status === "up_to_date") {
    return "success";
  }

  if (status === "outdated") {
    return "warning";
  }

  if (status === "status_unknown") {
    return "critical";
  }

  return "calm";
}

export function projectNeedsSync(project: Pick<ProjectRecord, "syncStatus">) {
  return project.syncStatus === "sync_needed";
}
