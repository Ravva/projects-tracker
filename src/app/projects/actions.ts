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
