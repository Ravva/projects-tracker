import "server-only";

import { ID, Query } from "node-appwrite";

import { getAppwriteConfig, getAppwriteDatabases } from "@/lib/server/appwrite";
import {
  buildWeekTemplate,
  startOfCurrentWeek,
  toIsoDate,
} from "@/lib/server/date-utils";
import { mapAttendanceLessonDocument } from "@/lib/server/mappers";
import { listStudents } from "@/lib/server/repositories/students";
import type { AttendanceWeekRecord } from "@/lib/types";

async function getWeekLessonDocuments(weekStart: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return [];
  }

  const response = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.lessons,
    [
      Query.equal("lesson_week_start", weekStart),
      Query.orderAsc("lesson_date"),
      Query.limit(10),
    ],
  );

  return response.documents;
}

export async function ensureCurrentWeekLessons() {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return [];
  }

  const weekStart = toIsoDate(startOfCurrentWeek());
  const existing = await getWeekLessonDocuments(weekStart);

  if (existing.length > 0) {
    return existing;
  }

  const template = buildWeekTemplate(startOfCurrentWeek());

  for (const item of template) {
    await appwrite.databases.createDocument(
      appwrite.databaseId,
      config.collections.lessons,
      ID.unique(),
      {
        title: item.title,
        lesson_date: item.lessonDate,
        lesson_week_start: weekStart,
        weekday_code: item.weekdayCode,
        is_generated: true,
        is_closed: false,
      },
    );
  }

  return getWeekLessonDocuments(weekStart);
}

export async function getCurrentAttendanceWeek(): Promise<AttendanceWeekRecord> {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const students = await listStudents();
  const weekStart = toIsoDate(startOfCurrentWeek());

  if (!appwrite || !config) {
    return {
      weekStart,
      lessons: [],
      rows: [],
      studentsNeedingAttention: [],
    };
  }

  const lessonDocuments = await ensureCurrentWeekLessons();
  const lessonIds = lessonDocuments.map((lesson) => lesson.$id);
  const attendanceResponse =
    lessonIds.length > 0
      ? await appwrite.databases.listDocuments(
          appwrite.databaseId,
          config.collections.attendance,
          [Query.equal("lesson_id", lessonIds), Query.limit(5000)],
        )
      : { documents: [] as Array<Record<string, unknown> & { $id: string }> };
  const attendanceDocuments = attendanceResponse.documents.map(
    (document) => document as Record<string, unknown> & { $id: string },
  );

  const lessons = lessonDocuments.map((document) => {
    const lessonAttendance = attendanceDocuments.filter(
      (attendance) => String(attendance.lesson_id ?? "") === document.$id,
    );

    return mapAttendanceLessonDocument(
      document,
      lessonAttendance.length,
      Math.max(students.length - lessonAttendance.length, 0),
    );
  });

  const rows = students.map((student) => {
    const lessonStates: Record<string, "present" | "absent" | "unmarked"> =
      Object.fromEntries(
        lessons.map((lesson) => {
          const attendance = attendanceDocuments.find(
            (item) =>
              String(item.student_id ?? "") === student.id &&
              String(item.lesson_id ?? "") === lesson.id,
          );

          const state =
            attendance === undefined
              ? "unmarked"
              : attendance.present
                ? "present"
                : "absent";

          return [lesson.id, state];
        }),
      ) as Record<string, "present" | "absent" | "unmarked">;

    return { student, lessonStates };
  });

  return {
    weekStart,
    lessons,
    rows,
    studentsNeedingAttention: students.filter(
      (student) => student.weeklyState !== "success",
    ),
  };
}

export async function saveWeekAttendance(
  weekStart: string,
  entries: Array<{
    lessonId: string;
    studentId: string;
    state: "present" | "absent" | "unmarked";
  }>,
) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const lessonIds = Array.from(new Set(entries.map((entry) => entry.lessonId)));
  const studentIds = Array.from(
    new Set(entries.map((entry) => entry.studentId)),
  );
  const response =
    lessonIds.length > 0 && studentIds.length > 0
      ? await appwrite.databases.listDocuments(
          appwrite.databaseId,
          config.collections.attendance,
          [
            Query.equal("lesson_id", lessonIds),
            Query.equal("student_id", studentIds),
            Query.limit(5000),
          ],
        )
      : { documents: [] as Array<Record<string, unknown> & { $id: string }> };
  const existingByPair = new Map(
    response.documents.map((document) => {
      const record = document as Record<string, unknown>;
      return [
        `${String(record.student_id)}:${String(record.lesson_id)}`,
        document.$id,
      ];
    }),
  );

  for (const entry of entries) {
    const key = `${entry.studentId}:${entry.lessonId}`;
    const existingId = existingByPair.get(key);

    if (entry.state === "unmarked") {
      if (existingId) {
        await appwrite.databases.deleteDocument(
          appwrite.databaseId,
          config.collections.attendance,
          existingId,
        );
      }

      continue;
    }

    const payload = {
      student_id: entry.studentId,
      lesson_id: entry.lessonId,
      present: entry.state === "present",
      lesson_week_start: weekStart,
    };

    if (existingId) {
      await appwrite.databases.updateDocument(
        appwrite.databaseId,
        config.collections.attendance,
        existingId,
        payload,
      );
    } else {
      await appwrite.databases.createDocument(
        appwrite.databaseId,
        config.collections.attendance,
        ID.unique(),
        payload,
      );
    }
  }
}

export async function markLessonForAllStudents(
  lessonId: string,
  state: "present" | "absent",
) {
  const students = await listStudents();

  await saveWeekAttendance(
    toIsoDate(startOfCurrentWeek()),
    students.map((student) => ({
      lessonId,
      studentId: student.id,
      state,
    })),
  );
}

export async function clearWeekAttendance(weekStart: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const lessons = await getWeekLessonDocuments(weekStart);

  if (lessons.length === 0) {
    return;
  }

  const attendance = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.attendance,
    [
      Query.equal(
        "lesson_id",
        lessons.map((lesson) => lesson.$id),
      ),
      Query.limit(5000),
    ],
  );

  for (const document of attendance.documents) {
    await appwrite.databases.deleteDocument(
      appwrite.databaseId,
      config.collections.attendance,
      document.$id,
    );
  }
}

export async function deleteLesson(lessonId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const attendance = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.attendance,
    [Query.equal("lesson_id", lessonId), Query.limit(5000)],
  );

  for (const document of attendance.documents) {
    await appwrite.databases.deleteDocument(
      appwrite.databaseId,
      config.collections.attendance,
      document.$id,
    );
  }

  await appwrite.databases.deleteDocument(
    appwrite.databaseId,
    config.collections.lessons,
    lessonId,
  );
}
