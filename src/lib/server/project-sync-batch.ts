import "server-only";

import { projectNeedsSync } from "@/lib/project-sync";
import {
  listProjects,
  runProjectAiAnalysis,
  syncProjectGithub,
} from "@/lib/server/repositories/projects";

export interface ProjectSyncBatchFailure {
  projectId: string;
  projectName: string;
  stage: "sync" | "ai";
  message: string;
}

export interface ProjectSyncBatchResult {
  checkedProjects: number;
  targetedProjects: number;
  syncedProjects: number;
  aiWarnings: number;
  failures: ProjectSyncBatchFailure[];
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim()
    ? error.message.trim()
    : fallback;
}

export async function runProjectSyncBatch(): Promise<ProjectSyncBatchResult> {
  const projects = await listProjects();
  const projectsToSync = projects.filter((project) =>
    projectNeedsSync(project),
  );
  const failures: ProjectSyncBatchFailure[] = [];
  let syncedProjects = 0;
  let aiWarnings = 0;

  for (const project of projectsToSync) {
    try {
      await syncProjectGithub(project.id);
      syncedProjects += 1;
    } catch (error) {
      failures.push({
        projectId: project.id,
        projectName: project.name,
        stage: "sync",
        message: getErrorMessage(error, "Не удалось выполнить GitHub sync."),
      });
      continue;
    }

    try {
      await runProjectAiAnalysis(project.id);
    } catch (error) {
      aiWarnings += 1;
      failures.push({
        projectId: project.id,
        projectName: project.name,
        stage: "ai",
        message: getErrorMessage(error, "Не удалось завершить AI-анализ."),
      });
    }
  }

  return {
    checkedProjects: projects.length,
    targetedProjects: projectsToSync.length,
    syncedProjects,
    aiWarnings,
    failures,
  };
}
