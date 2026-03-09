"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacherSession } from "@/lib/server/auth";
import {
  clearProjectManualOverride,
  createProject,
  deleteProject,
  runProjectAiAnalysis,
  setProjectManualOverride,
  syncProjectGithub,
  updateProject,
} from "@/lib/server/repositories/projects";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createProjectAction(formData: FormData) {
  await requireTeacherSession();

  await createProject({
    studentId: readString(formData, "studentId"),
    name: readString(formData, "name"),
    summary: readString(formData, "summary"),
    githubUrl: readString(formData, "githubUrl"),
    status: readString(formData, "status") || "draft",
    specMarkdown: readString(formData, "specMarkdown"),
    planMarkdown: readString(formData, "planMarkdown"),
  });

  revalidatePath("/projects");
  revalidatePath("/");
}

export async function updateProjectAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");

  await updateProject(projectId, {
    studentId: readString(formData, "studentId"),
    name: readString(formData, "name"),
    summary: readString(formData, "summary"),
    githubUrl: readString(formData, "githubUrl"),
    status: readString(formData, "status") || "draft",
    specMarkdown: readString(formData, "specMarkdown"),
    planMarkdown: readString(formData, "planMarkdown"),
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
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

  await runProjectAiAnalysis(projectId);

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function setProjectOverrideAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");
  const percent = Number(readString(formData, "manualCompletionPercent"));
  const note = readString(formData, "manualOverrideNote");

  await setProjectManualOverride(projectId, percent, note);

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

export async function clearProjectOverrideAction(formData: FormData) {
  await requireTeacherSession();

  const projectId = readString(formData, "projectId");

  await clearProjectManualOverride(projectId);

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}
