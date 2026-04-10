"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacherSession } from "@/lib/server/auth";
import {
  createStudent,
  deleteStudent,
  getStudent,
  updateStudent,
} from "@/lib/server/repositories/students";
import {
  sendTelegramMessage,
  TELEGRAM_CHAT_ID_PATTERN,
} from "@/lib/server/telegram";
import {
  issueStudentGithubLink,
  issueStudentTelegramInvite,
} from "@/lib/server/telegram-linking";
import type { BulkNotificationResult } from "@/lib/types";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readCellValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

async function readWorksheetRows(file: File) {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = await file.arrayBuffer();

  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return [] as Record<string, string>[];
  }

  const headerRow = worksheet.getRow(1);
  const headerValues = Array.isArray(headerRow.values) ? headerRow.values : [];
  const headers = headerValues
    .slice(1)
    .map((value) => String(value ?? "").trim());
  const rows: Record<string, string>[] = [];

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const worksheetRow = worksheet.getRow(rowNumber);
    const row: Record<string, string> = {};
    let hasData = false;

    for (let columnIndex = 1; columnIndex <= headers.length; columnIndex += 1) {
      const header = headers[columnIndex - 1];

      if (!header) {
        continue;
      }

      const cellText = String(
        worksheetRow.getCell(columnIndex).text ?? "",
      ).trim();

      if (cellText) {
        hasData = true;
      }

      row[header] = cellText;
    }

    if (hasData) {
      rows.push(row);
    }
  }

  return rows;
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

  if (!TELEGRAM_CHAT_ID_PATTERN.test(student.telegramChatId)) {
    throw new Error(
      "У студента сохранён некорректный chat id. Нужна строка из цифр, иногда с ведущим '-'.",
    );
  }

  const result = await sendTelegramMessage(student.telegramChatId, message);

  if (!result.ok) {
    throw new Error(result.message);
  }

  revalidatePath(`/students/${studentId}`);
}

export async function issueStudentTelegramInviteAction(studentId: string) {
  await requireTeacherSession();

  const issued = await issueStudentTelegramInvite(studentId);

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);

  return issued;
}

export async function issueStudentGithubLinkAction(
  studentId: string,
  resetCurrentIdentity = false,
) {
  await requireTeacherSession();

  const issued = await issueStudentGithubLink(studentId, {
    resetCurrentIdentity,
  });

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/");

  return issued;
}

export async function sendBulkStudentNotificationAction(
  formData: FormData,
): Promise<BulkNotificationResult> {
  await requireTeacherSession();

  const message = readString(formData, "message");
  const studentIds = formData
    .getAll("studentIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!message) {
    throw new Error("Сообщение не может быть пустым");
  }

  if (studentIds.length === 0) {
    throw new Error("Нужно выбрать хотя бы одного ученика");
  }

  const result: BulkNotificationResult = {
    requested: studentIds.length,
    eligible: 0,
    sent: 0,
    skippedNoChatId: 0,
    skippedInvalidChatId: 0,
    failed: [],
  };

  const uniqueStudentIds = [...new Set(studentIds)];

  for (const studentId of uniqueStudentIds) {
    const student = await getStudent(studentId);

    if (!student) {
      result.failed.push({
        studentName: `ID ${studentId}`,
        reason: "Карточка ученика не найдена.",
      });
      continue;
    }

    const studentName = `${student.firstName} ${student.lastName}`;

    if (!student.telegramChatId) {
      result.skippedNoChatId += 1;
      continue;
    }

    if (!TELEGRAM_CHAT_ID_PATTERN.test(student.telegramChatId)) {
      result.skippedInvalidChatId += 1;
      result.failed.push({
        studentName,
        reason:
          "У карточки сохранён некорректный chat id. Нужна строка из цифр, иногда с ведущим '-'.",
      });
      continue;
    }

    result.eligible += 1;

    const sendResult = await sendTelegramMessage(
      student.telegramChatId,
      message,
    );

    if (!sendResult.ok) {
      result.failed.push({
        studentName,
        reason: sendResult.message,
      });
      continue;
    }

    result.sent += 1;
  }

  revalidatePath("/students");

  return result;
}

export async function importStudentsAction(formData: FormData) {
  await requireTeacherSession();

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("Файл не выбран или пуст");
  }

  const rows = await readWorksheetRows(file);

  for (const row of rows) {
    const fullName = readCellValue(row, ["ФИО", "Имя", "Name"]);
    if (!fullName) continue;

    const parts = fullName.split(/\s+/);
    const lastName = parts[0] || "Не указано";
    const firstName = parts.slice(1).join(" ") || "Ученик";

    const githubUsername = readCellValue(row, [
      "GitHub",
      "github",
      "github_username",
    ]);
    const telegramUsername = readCellValue(row, [
      "Telegram",
      "telegram",
      "telegram_username",
    ]);

    await createStudent({
      firstName,
      lastName,
      githubUsername,
      githubUserId: "",
      telegramUsername,
      telegramChatId: "",
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
