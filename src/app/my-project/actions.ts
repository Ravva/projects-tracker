"use server";

import { revalidatePath } from "next/cache";

import { requireStudentSession } from "@/lib/server/auth";
import { createStudentProjectFromGithubSelection } from "@/lib/server/repositories/projects";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function chooseStudentProjectAction(formData: FormData) {
  const student = await requireStudentSession();

  await createStudentProjectFromGithubSelection({
    studentId: student.studentId,
    studentName: student.studentName,
    repositoryName: readString(formData, "repositoryName"),
    repositoryUrl: readString(formData, "repositoryUrl"),
    repositoryDescription: readString(formData, "repositoryDescription"),
  });

  revalidatePath("/my-project");
  revalidatePath("/projects");
  revalidatePath("/");
}
