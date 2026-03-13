import type { ProjectRecord, ProjectRisk } from "@/lib/types";

type ProjectRiskTone = "critical" | "warning" | "success" | "calm";

const PROJECT_RISK_LABELS: Record<ProjectRisk, string> = {
  data_missing: "данные отсутствуют",
  healthy: "стабильно",
  invalid_github_repo: "ошибка GitHub repo",
  missing_memory_bank: "нет memory_bank",
  missing_spec: "нет ТЗ",
  missing_plan: "нет плана",
  abandoned: "заброшен",
  stale_repo: "устаревший repo",
  low_progress: "низкий прогресс",
};

export function getProjectRiskLabel(risk: ProjectRisk) {
  return PROJECT_RISK_LABELS[risk];
}

export function getProjectRiskTone(
  project: Pick<ProjectRecord, "hasAiAnalysisSnapshot" | "progress" | "risk">,
): ProjectRiskTone {
  if (!project.hasAiAnalysisSnapshot) {
    return "calm";
  }

  if (project.risk === "healthy") {
    return project.progress >= 75 ? "success" : "warning";
  }

  if (
    project.risk === "missing_memory_bank" ||
    project.risk === "missing_spec" ||
    project.risk === "missing_plan" ||
    project.risk === "low_progress"
  ) {
    return "warning";
  }

  return "critical";
}

export function getProjectProgressLabel(
  project: Pick<ProjectRecord, "hasAiAnalysisSnapshot" | "progress">,
) {
  return project.hasAiAnalysisSnapshot ? `${project.progress}%` : "Нет данных";
}

export function getProjectBooleanMetricLabel(
  project: Pick<ProjectRecord, "hasAiAnalysisSnapshot">,
  value: boolean,
  labels: {
    positive: string;
    negative: string;
  },
) {
  if (!project.hasAiAnalysisSnapshot) {
    return "нет данных";
  }

  return value ? labels.positive : labels.negative;
}

export function isProjectInReviewZone(
  project: Pick<ProjectRecord, "hasAiAnalysisSnapshot" | "progress" | "risk">,
) {
  if (
    project.risk === "invalid_github_repo" ||
    project.risk === "abandoned" ||
    project.risk === "stale_repo"
  ) {
    return true;
  }

  if (!project.hasAiAnalysisSnapshot) {
    return false;
  }

  return project.risk !== "healthy" || project.progress < 50;
}
