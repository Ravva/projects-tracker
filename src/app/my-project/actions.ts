"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStudentSession } from "@/lib/server/auth";
import {
  createStudentProjectFromGithubSelection,
  runProjectAiAnalysis,
} from "@/lib/server/repositories/projects";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function chooseStudentProjectAction(formData: FormData) {
  const student = await requireStudentSession();
  let autoAnalysisNotice = "";

  try {
    const project = await createStudentProjectFromGithubSelection({
      studentId: student.studentId,
      studentName: student.studentName,
      repositoryName: readString(formData, "repositoryName"),
      repositoryUrl: readString(formData, "repositoryUrl"),
      repositoryDescription: readString(formData, "repositoryDescription"),
    });

    try {
      await runProjectAiAnalysis(project.$id);
    } catch (error) {
      autoAnalysisNotice =
        error instanceof Error && error.message.trim()
          ? `Репозиторий привязан, но автоматический AI-анализ пока не завершился: ${error.message.trim()}`
          : "Репозиторий привязан, но автоматический AI-анализ пока не завершился.";

      console.error("[my-project] Automatic AI analysis failed", {
        studentId: student.studentId,
        githubLogin: student.githubLogin,
        projectId: project.$id,
        repositoryUrl: readString(formData, "repositoryUrl"),
        error,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "Не удалось привязать репозиторий. Повторите попытку позже.";

    console.error("[my-project] Failed to create student project", {
      studentId: student.studentId,
      githubLogin: student.githubLogin,
      repositoryUrl: readString(formData, "repositoryUrl"),
      error,
    });

    redirect(`/my-project?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/my-project");
  revalidatePath("/projects");
  revalidatePath("/");

  const params = new URLSearchParams({
    success: "project-created",
  });

  if (autoAnalysisNotice) {
    params.set("notice", autoAnalysisNotice);
  }

  redirect(`/my-project?${params.toString()}`);
}
