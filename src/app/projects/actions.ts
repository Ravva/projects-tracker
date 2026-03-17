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

  await syncProjectGithub(projectId);

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function runProjectAiAnalysisAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");

  try {
    await runProjectAiAnalysis(projectId);
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Не удалось завершить AI-анализ проекта.";

    redirect(
      buildProjectDetailsRedirect(projectId, {
        error: message,
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
