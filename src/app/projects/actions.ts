"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacherSession } from "@/lib/server/auth";
import {
  deleteProject,
  runProjectAiAnalysis,
  setProjectStatus,
  syncProjectGithub,
} from "@/lib/server/repositories/projects";

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
    await runProjectAiAnalysis(projectId);
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
          ...(notice
            ? {
                notice: `GitHub sync выполнен, но автоматический AI-анализ не завершился: ${notice}`,
              }
            : {}),
        })
      : buildProjectDetailsRedirect(projectId, {
          success: "sync-complete",
          ...(notice
            ? {
                notice: `GitHub sync выполнен, но автоматический AI-анализ не завершился: ${notice}`,
              }
            : {}),
        }),
  );
}

export async function runProjectAiAnalysisAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");

  try {
    await runProjectAiAnalysis(projectId);
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
