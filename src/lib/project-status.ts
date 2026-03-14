import type { ProjectStatus } from "@/lib/types";

export function normalizeProjectStatus(value: unknown): ProjectStatus {
  if (value === "completed") {
    return "completed";
  }

  if (value === "active") {
    return "active";
  }

  return "draft";
}

export function getProjectStatusLabel(status: ProjectStatus) {
  if (status === "completed") {
    return "завершен";
  }

  if (status === "active") {
    return "в работе";
  }

  return "черновик";
}

export function isProjectCompleted(status: ProjectStatus) {
  return status === "completed";
}

export function isProjectCurrent(status: ProjectStatus) {
  return !isProjectCompleted(status);
}
