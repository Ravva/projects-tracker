"use server";

import { revalidatePath } from "next/cache";

import { requireTeacherSession } from "@/lib/server/auth";
import {
  clearWeekAttendance,
  deleteLesson,
  markLessonForAllStudents,
  saveWeekAttendance,
} from "@/lib/server/repositories/attendance";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveAttendanceAction(formData: FormData) {
  await requireTeacherSession();

  const weekStart = readString(formData, "weekStart");
  const entries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("attendance:"))
    .map(([key, value]) => {
      const [, studentId, lessonId] = key.split(":");

      return {
        studentId,
        lessonId,
        state: String(value) as "present" | "absent" | "unmarked",
      };
    });

  await saveWeekAttendance(weekStart, entries);

  revalidatePath("/attendance");
  revalidatePath("/students");
  revalidatePath("/");
}

export async function markAllPresentAction(formData: FormData) {
  await requireTeacherSession();

  const lessonId = readString(formData, "lessonId");

  await markLessonForAllStudents(lessonId, "present");

  revalidatePath("/attendance");
  revalidatePath("/students");
  revalidatePath("/");
}

export async function clearAttendanceAction(formData: FormData) {
  await requireTeacherSession();

  const weekStart = readString(formData, "weekStart");

  await clearWeekAttendance(weekStart);

  revalidatePath("/attendance");
  revalidatePath("/students");
  revalidatePath("/");
}

export async function deleteLessonAction(formData: FormData) {
  await requireTeacherSession();

  const lessonId = readString(formData, "lessonId");

  await deleteLesson(lessonId);

  revalidatePath("/attendance");
  revalidatePath("/students");
  revalidatePath("/");
}
