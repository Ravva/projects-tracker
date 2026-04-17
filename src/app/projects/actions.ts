"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacherSession } from "@/lib/server/auth";
import { runProjectSyncBatch } from "@/lib/server/project-sync-batch";
import {
  addProjectMember,
  deleteProject,
  getProject,
  removeProjectMember,
  runProjectAiAnalysis,
  setProjectGroupMode,
  setProjectStatus,
  syncProjectGithub,
} from "@/lib/server/repositories/projects";

function buildAiProviderLabel(providerCode: string) {
  return providerCode.trim().toUpperCase() === "HF" ? "HF" : "CF";
}

function inferAiProviderLabelFromMessage(message: string) {
  const normalized = message.trim().toUpperCase();

  if (
    /HUGGING FACE|HF_TOKEN|HF_|HF\b/.test(normalized) &&
    !/AI GATEWAY/.test(normalized)
  ) {
    return "HF";
  }

  return "CF";
}

function buildAutoAnalysisNotice(message: string, providerLabel: string) {
  return `GitHub sync выполнен, но автоматический AI-анализ (${providerLabel}) не завершился: ${message}`;
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim()
    ? error.message.trim()
    : fallback;
}

function buildProjectDetailsRedirect(
  projectId: string,
  searchParams: Record<string, string>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const normalized = value.trim();

    if (!normalized) {
      continue;
    }

    params.set(key, normalized);
  }

  const query = params.toString();

  return query ? `/projects/${projectId}?${query}` : `/projects/${projectId}`;
}

function buildProjectsListRedirect(searchParams: Record<string, string>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const normalized = value.trim();

    if (!normalized) {
      continue;
    }

    params.set(key, normalized);
  }

  const query = params.toString();

  return query ? `/projects?${query}` : "/projects";
}

async function revalidateProjectRelatedPaths(projectId: string) {
  const project = await getProject(projectId);

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/my-project");
  revalidatePath("/students");

  if (!project) {
    return;
  }

  for (const studentId of project.memberStudentIds) {
    revalidatePath(`/students/${studentId}`);
  }
}

export async function deleteProjectAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");
  const project = await getProject(projectId);

  await deleteProject(projectId);

  revalidatePath("/projects");
  revalidatePath("/my-project");
  revalidatePath("/students");

  if (project) {
    for (const studentId of project.memberStudentIds) {
      revalidatePath(`/students/${studentId}`);
    }
  }

  redirect("/projects");
}

export async function syncProjectAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");
  const returnTo = readString(formData, "returnTo");
  let notice = "";
  let aiProvider = "";

  try {
    await syncProjectGithub(projectId);
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      "Не удалось синхронизировать GitHub-репозиторий.",
    );

    redirect(
      returnTo === "projects"
        ? buildProjectsListRedirect({
            error: errorMessage,
            projectId,
          })
        : buildProjectDetailsRedirect(projectId, {
            error: errorMessage,
          }),
    );
  }

  try {
    const analysisResult = await runProjectAiAnalysis(projectId);
    aiProvider = buildAiProviderLabel(analysisResult.providerCode);
  } catch (error) {
    notice = getErrorMessage(
      error,
      "Автоматический AI-анализ после GitHub sync не завершился.",
    );
    aiProvider = inferAiProviderLabelFromMessage(notice);
  }

  await revalidateProjectRelatedPaths(projectId);

  redirect(
    returnTo === "projects"
      ? buildProjectsListRedirect({
          success: notice ? "sync-complete-with-warning" : "sync-complete",
          projectId,
          ...(aiProvider ? { aiProvider } : {}),
          ...(notice
            ? {
                notice: buildAutoAnalysisNotice(notice, aiProvider || "CF"),
              }
            : {}),
        })
      : buildProjectDetailsRedirect(projectId, {
          success: notice ? "sync-complete-with-warning" : "sync-complete",
          ...(aiProvider ? { aiProvider } : {}),
          ...(notice
            ? {
                notice: buildAutoAnalysisNotice(notice, aiProvider || "CF"),
              }
            : {}),
        }),
  );
}

export async function syncAllProjectsAction() {
  await requireTeacherSession();

  const result = await runProjectSyncBatch();

  if (result.targetedProjects === 0) {
    redirect(
      buildProjectsListRedirect({
        notice:
          "Все проекты уже синхронизированы, новые коммиты в GitHub не обнаружены.",
      }),
    );
  }

  revalidatePath("/projects");

  const resultSummary = `Обновлено ${result.syncedProjects} из ${result.targetedProjects} проект(ов).`;
  const noticeParts = [
    result.aiProviderCounts.CF > 0 || result.aiProviderCounts.HF > 0
      ? `Провайдеры AI: ${[
          result.aiProviderCounts.CF > 0
            ? `CF ${result.aiProviderCounts.CF}`
            : "",
          result.aiProviderCounts.HF > 0
            ? `HF ${result.aiProviderCounts.HF}`
            : "",
        ]
          .filter(Boolean)
          .join(", ")}.`
      : "",
    result.aiWarnings > 0
      ? `Для ${result.aiWarnings} проект(ов) GitHub sync прошёл, но AI-анализ завершился с предупреждением.`
      : "",
    result.failures.length > 0
      ? `Детали: ${result.failures
          .slice(0, 3)
          .map((failure) => `${failure.projectName}: ${failure.message}`)
          .join(" | ")}`
      : "",
  ].filter(Boolean);

  redirect(
    buildProjectsListRedirect({
      success: "sync-all-complete",
      notice: [resultSummary, ...noticeParts].join(" "),
    }),
  );
}

export async function runProjectAiAnalysisAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");
  let aiProvider = "";

  try {
    const analysisResult = await runProjectAiAnalysis(projectId);
    aiProvider = buildAiProviderLabel(analysisResult.providerCode);
  } catch (error) {
    redirect(
      buildProjectDetailsRedirect(projectId, {
        error: getErrorMessage(
          error,
          "Не удалось завершить AI-анализ проекта.",
        ),
      }),
    );
  }

  await revalidateProjectRelatedPaths(projectId);

  redirect(
    buildProjectDetailsRedirect(projectId, {
      success: "analysis-complete",
      ...(aiProvider ? { aiProvider } : {}),
    }),
  );
}

export async function setProjectStatusAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");
  const status = readString(formData, "status");

  await setProjectStatus(
    projectId,
    status === "completed" ? "completed" : "active",
  );

  await revalidateProjectRelatedPaths(projectId);
}

export async function addProjectMemberAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");
  const studentId = readString(formData, "studentId");

  try {
    await addProjectMember(projectId, studentId);
  } catch (error) {
    redirect(
      buildProjectDetailsRedirect(projectId, {
        error: getErrorMessage(error, "Не удалось добавить участника проекта."),
      }),
    );
  }

  await revalidateProjectRelatedPaths(projectId);

  redirect(
    buildProjectDetailsRedirect(projectId, {
      success: "member-added",
    }),
  );
}

export async function removeProjectMemberAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");
  const studentId = readString(formData, "studentId");

  try {
    await removeProjectMember(projectId, studentId);
  } catch (error) {
    redirect(
      buildProjectDetailsRedirect(projectId, {
        error: getErrorMessage(error, "Не удалось удалить участника проекта."),
      }),
    );
  }

  await revalidateProjectRelatedPaths(projectId);

  redirect(
    buildProjectDetailsRedirect(projectId, {
      success: "member-removed",
    }),
  );
}

export async function setProjectGroupModeAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");
  const isGroupProject = readString(formData, "isGroupProject") === "true";

  try {
    await setProjectGroupMode(projectId, isGroupProject);
  } catch (error) {
    redirect(
      buildProjectDetailsRedirect(projectId, {
        error: getErrorMessage(
          error,
          "Не удалось обновить режим группового проекта.",
        ),
      }),
    );
  }

  await revalidateProjectRelatedPaths(projectId);
}
