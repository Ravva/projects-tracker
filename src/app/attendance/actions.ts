"use server";

import { revalidatePath } from "next/cache";

import { requireTeacherSession } from "@/lib/server/auth";
import {
  clearWeekAttendance,
  deleteLesson,
  markLessonForAllStudents,
  saveWeekAttendance,
  setLessonClosedState,
} from "@/lib/server/repositories/attendance";
import type { AttendanceState } from "@/lib/types";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function saveAttendanceAction(formData: FormData) {
  await requireTeacherSession();

  const weekStart = readString(formData, "weekStart");
  const lessonClosedEntries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("lessonClosed:"))
    .map(([key, value]) => ({
      lessonId: key.replace("lessonClosed:", ""),
      isClosed: String(value) === "true",
    }));
  const entries = Array.from(formData.entries())
    .filter(([key]) => key.startsWith("attendance:"))
    .map(([key, value]) => {
      const [, studentId, lessonId] = key.split(":");

      return {
        studentId,
        lessonId,
        state: String(value) as AttendanceState,
      };
    });

  await Promise.all(
    lessonClosedEntries.map(({ lessonId, isClosed }) =>
      setLessonClosedState(lessonId, isClosed),
    ),
  );
  await saveWeekAttendance(weekStart, entries);

  revalidatePath("/attendance");
  revalidatePath("/students");
  revalidatePath("/");
}

export async function setAttendanceCellAction(formData: FormData) {
  await requireTeacherSession();

  const weekStart = readString(formData, "weekStart");
  const studentId = readString(formData, "studentId");
  const lessonId = readString(formData, "lessonId");
  const state = readString(formData, "state") as AttendanceState;

  await saveWeekAttendance(weekStart, [
    {
      lessonId,
      studentId,
      state,
    },
  ]);

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
