"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacherSession } from "@/lib/server/auth";
import {
  createStudent,
  deleteStudent,
  updateStudent,
} from "@/lib/server/repositories/students";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createStudentAction(formData: FormData) {
  await requireTeacherSession();

  await createStudent({
    firstName: readString(formData, "firstName"),
    lastName: readString(formData, "lastName"),
    githubUsername: readString(formData, "githubUsername"),
    githubUserId: readString(formData, "githubUserId"),
    telegramUsername: readString(formData, "telegramUsername"),
    telegramChatId: readString(formData, "telegramChatId"),
    notes: readString(formData, "notes"),
  });

  revalidatePath("/students");
  revalidatePath("/");
}

export async function updateStudentAction(formData: FormData) {
  await requireTeacherSession();

  const studentId = readString(formData, "studentId");

  await updateStudent(studentId, {
    firstName: readString(formData, "firstName"),
    lastName: readString(formData, "lastName"),
    githubUsername: readString(formData, "githubUsername"),
    githubUserId: readString(formData, "githubUserId"),
    telegramUsername: readString(formData, "telegramUsername"),
    telegramChatId: readString(formData, "telegramChatId"),
    notes: readString(formData, "notes"),
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/");
}

export async function deleteStudentAction(formData: FormData) {
  await requireTeacherSession();

  const studentId = readString(formData, "studentId");

  await deleteStudent(studentId);

  revalidatePath("/students");
  revalidatePath("/projects");
  revalidatePath("/attendance");
  revalidatePath("/");
  redirect("/students");
}
