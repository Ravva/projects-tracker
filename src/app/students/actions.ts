"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import * as XLSX from "xlsx";

import { requireTeacherSession } from "@/lib/server/auth";
import {
  createStudent,
  deleteStudent,
  getStudent,
  updateStudent,
} from "@/lib/server/repositories/students";
import { sendTelegramMessage } from "@/lib/server/telegram";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function sendStudentNotificationAction(formData: FormData) {
  await requireTeacherSession();

  const studentId = readString(formData, "studentId");
  const message = readString(formData, "message");

  if (!message) {
    throw new Error("Сообщение не может быть пустым");
  }

  const student = await getStudent(studentId);
  if (!student || !student.telegramChatId) {
    throw new Error("Chat ID студента не найден");
  }

  const success = await sendTelegramMessage(student.telegramChatId, message);

  if (!success) {
    throw new Error("Не удалось отправить сообщение в Telegram");
  }

  revalidatePath(`/students/${studentId}`);
}

export async function importStudentsAction(formData: FormData) {
  await requireTeacherSession();

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("Файл не выбран или пуст");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  // Use header: 1 to get rows as arrays for more flexible parsing
  const rows = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

  for (const row of rows) {
    // Маппинг полей (поддержка разных вариантов названий колонок)
    const fullName = String(
      row["ФИО"] || row["Имя"] || row["Name"] || "",
    ).trim();
    if (!fullName) continue;

    const parts = fullName.split(/\s+/);
    const lastName = parts[0] || "Не указано";
    const firstName = parts.slice(1).join(" ") || "Ученик";

    const githubUsername = String(
      row["GitHub"] || row["github"] || row["github_username"] || "",
    ).trim();
    const telegramUsername = String(
      row["Telegram"] || row["telegram"] || row["telegram_username"] || "",
    ).trim();

    await createStudent({
      firstName,
      lastName,
      githubUsername,
      githubUserId: "", // Будет заполнено позже при синхронизации
      telegramUsername,
      telegramChatId: "", // Будет заполнено вручную или через бота
      notes: "Импортировано из XLSX",
    });
  }

  revalidatePath("/students");
  revalidatePath("/");
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
