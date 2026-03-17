"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStudentSession } from "@/lib/server/auth";
import { createStudentProjectFromGithubSelection } from "@/lib/server/repositories/projects";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function chooseStudentProjectAction(formData: FormData) {
  const student = await requireStudentSession();

  try {
    await createStudentProjectFromGithubSelection({
      studentId: student.studentId,
      studentName: student.studentName,
      repositoryName: readString(formData, "repositoryName"),
      repositoryUrl: readString(formData, "repositoryUrl"),
      repositoryDescription: readString(formData, "repositoryDescription"),
    });
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
  redirect("/my-project?success=project-created");
}
