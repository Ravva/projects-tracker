"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacherSession } from "@/lib/server/auth";
import { runProjectSyncBatch } from "@/lib/server/project-sync-batch";
import {
  deleteProject,
  runProjectAiAnalysis,
  setProjectStatus,
  syncProjectGithub,
} from "@/lib/server/repositories/projects";

function buildAiProviderLabel(providerCode: string) {
  return providerCode.trim().toUpperCase() === "HF" ? "HF" : "CF";
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

export async function deleteProjectAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");

  await deleteProject(projectId);

  revalidatePath("/projects");
  revalidatePath("/");
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
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");

  redirect(
    returnTo === "projects"
      ? buildProjectsListRedirect({
          success: "sync-complete",
          projectId,
          ...(aiProvider ? { aiProvider } : {}),
          ...(notice
            ? {
                notice: `GitHub sync выполнен, но автоматический AI-анализ не завершился: ${notice}`,
              }
            : {}),
        })
      : buildProjectDetailsRedirect(projectId, {
          success: "sync-complete",
          ...(aiProvider ? { aiProvider } : {}),
          ...(notice
            ? {
                notice: `GitHub sync выполнен, но автоматический AI-анализ не завершился: ${notice}`,
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
  revalidatePath("/");

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

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");

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
  const studentId = readString(formData, "studentId");

  await setProjectStatus(
    projectId,
    status === "completed" ? "completed" : "active",
  );

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/my-project");
  revalidatePath("/");
  revalidatePath("/students");

  if (studentId) {
    revalidatePath(`/students/${studentId}`);
  }
}
