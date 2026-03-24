import "server-only";

import { ID, Query } from "node-appwrite";

import { isProjectCurrent, normalizeProjectStatus } from "@/lib/project-status";
import { getAppwriteConfig, getAppwriteDatabases } from "@/lib/server/appwrite";
import { daysSince, normalizeWeekStart } from "@/lib/server/date-utils";
import { mapStudentDocument, toStudentDocument } from "@/lib/server/mappers";
import { deleteProjectCascade } from "@/lib/server/project-cleanup";
import type { StudentInput, StudentRecord, WeeklyState } from "@/lib/types";

type StudentSummary = Pick<
  StudentRecord,
  | "attendanceRate"
  | "weeklyState"
  | "projectsCount"
  | "activeProjectsCount"
  | "completedProjectsCount"
  | "lastActivity"
  | "aiSummary"
>;

function buildWeeklyState(attendanceRate: number): WeeklyState {
  if (attendanceRate < 25) {
    return "critical";
  }

  if (attendanceRate < 75) {
    return "warning";
  }

  return "success";
}

async function buildStudentSummaries(
  studentIds: string[],
  inputWeekStart?: string,
) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config || studentIds.length === 0) {
    return new Map<string, StudentSummary>();
  }

  const weekStart = normalizeWeekStart(inputWeekStart);
  const [projectsResponse, lessonsResponse, attendanceResponse] =
    await Promise.all([
      appwrite.databases.listDocuments(
        appwrite.databaseId,
        config.collections.projects,
        [Query.limit(500)],
      ),
      appwrite.databases.listDocuments(
        appwrite.databaseId,
        config.collections.lessons,
        [Query.equal("lesson_week_start", weekStart), Query.limit(10)],
      ),
      appwrite.databases.listDocuments(
        appwrite.databaseId,
        config.collections.attendance,
        [Query.equal("student_id", studentIds), Query.limit(1000)],
      ),
    ]);

  const projectCountMap = new Map<string, number>();
  const activeProjectCountMap = new Map<string, number>();
  const completedProjectCountMap = new Map<string, number>();
  const lastActivityMap = new Map<string, string>();
  const aiSummaryMap = new Map<string, string>();

  for (const document of projectsResponse.documents) {
    const studentId = String(
      (document as Record<string, unknown>).student_id ?? "",
    );
    const status = normalizeProjectStatus(
      (document as Record<string, unknown>).status ?? "draft",
    );
    const projectState = String(
      (document as Record<string, unknown>).project_state_json ?? "",
    );

    if (!studentId) {
      continue;
    }

    projectCountMap.set(studentId, (projectCountMap.get(studentId) ?? 0) + 1);
    if (isProjectCurrent(status)) {
      activeProjectCountMap.set(
        studentId,
        (activeProjectCountMap.get(studentId) ?? 0) + 1,
      );
    } else {
      completedProjectCountMap.set(
        studentId,
        (completedProjectCountMap.get(studentId) ?? 0) + 1,
      );
    }

    let aiSummary = "";
    let lastCommitAt = "";

    try {
      const parsedState = JSON.parse(projectState) as {
        aiSummary?: unknown;
      };
      aiSummary = String(parsedState.aiSummary ?? "");
    } catch {}

    try {
      const githubState = JSON.parse(
        String((document as Record<string, unknown>).github_state_json ?? ""),
      ) as {
        lastCommitAt?: unknown;
      };
      lastCommitAt = String(githubState.lastCommitAt ?? "");
    } catch {}

    if (aiSummary && isProjectCurrent(status) && !aiSummaryMap.has(studentId)) {
      aiSummaryMap.set(studentId, aiSummary);
    }

    if (aiSummary && !aiSummaryMap.has(studentId)) {
      aiSummaryMap.set(studentId, aiSummary);
    }

    if (lastCommitAt) {
      const previous = lastActivityMap.get(studentId);

      if (!previous || new Date(lastCommitAt) > new Date(previous)) {
        lastActivityMap.set(studentId, lastCommitAt);
      }
    }
  }

  const lessonIds = lessonsResponse.documents.map((lesson) => lesson.$id);
  const requiredMin = Math.min(2, lessonIds.length);
  const attendanceCountMap = new Map<string, number>();

  for (const document of attendanceResponse.documents) {
    const record = document as Record<string, unknown>;
    const studentId = String(record.student_id ?? "");
    const lessonId = String(record.lesson_id ?? "");
    const present = Boolean(record.present ?? false);

    if (!studentId || !lessonIds.includes(lessonId) || !present) {
      continue;
    }

    attendanceCountMap.set(
      studentId,
      (attendanceCountMap.get(studentId) ?? 0) + 1,
    );
  }

  return new Map<string, StudentSummary>(
    studentIds.map((studentId) => {
      const presentCount = attendanceCountMap.get(studentId) ?? 0;
      const attendanceRate =
        requiredMin > 0 ? Math.round((presentCount / requiredMin) * 100) : 0;
      const lastActivityIso = lastActivityMap.get(studentId);
      const lastActivity =
        lastActivityIso && Number.isFinite(daysSince(lastActivityIso))
          ? `${daysSince(lastActivityIso)} дн. назад`
          : "Нет активности";

      return [
        studentId,
        {
          attendanceRate,
          weeklyState: buildWeeklyState(attendanceRate),
          projectsCount: projectCountMap.get(studentId) ?? 0,
          activeProjectsCount: activeProjectCountMap.get(studentId) ?? 0,
          completedProjectsCount: completedProjectCountMap.get(studentId) ?? 0,
          lastActivity,
          aiSummary:
            aiSummaryMap.get(studentId) ?? "AI summary пока не рассчитан.",
        },
      ];
    }),
  );
}

export async function listStudents(
  inputWeekStart?: string,
): Promise<StudentRecord[]> {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return [];
  }

  try {
    const response = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      config.collections.students,
      [
        Query.orderAsc("last_name"),
        Query.orderAsc("first_name"),
        Query.limit(500),
      ],
    );
    const summaries = await buildStudentSummaries(
      response.documents.map((doc) => doc.$id),
      inputWeekStart,
    );

    return response.documents.map((document) =>
      mapStudentDocument(document, summaries.get(document.$id)),
    );
  } catch {
    return [];
  }
}

export async function getStudent(
  studentId: string,
  inputWeekStart?: string,
): Promise<StudentRecord | null> {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    return null;
  }

  try {
    const [document, summaries] = await Promise.all([
      appwrite.databases.getDocument(
        appwrite.databaseId,
        config.collections.students,
        studentId,
      ),
      buildStudentSummaries([studentId], inputWeekStart),
    ]);

    return mapStudentDocument(document, summaries.get(studentId));
  } catch {
    return null;
  }
}

export async function getStudentByGithubUserId(
  githubUserId: string,
): Promise<StudentRecord | null> {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const normalizedGithubUserId = githubUserId.trim();

  if (!appwrite || !config || !normalizedGithubUserId) {
    return null;
  }

  try {
    const response = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      config.collections.students,
      [Query.equal("github_user_id", normalizedGithubUserId), Query.limit(1)],
    );
    const document = response.documents[0];

    return document ? mapStudentDocument(document) : null;
  } catch {
    return null;
  }
}

export async function claimStudentGithubIdentity(input: {
  studentId: string;
  githubUserId: string;
  githubUsername: string;
}) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  return appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.students,
    input.studentId,
    {
      github_user_id: input.githubUserId.trim(),
      github_username: input.githubUsername.trim(),
      github_link_token: "",
      github_link_expires_at: "",
    },
  );
}

export async function resetStudentGithubIdentity(studentId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  return appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.students,
    studentId,
    {
      github_user_id: "",
      github_username: "",
      github_link_token: "",
      github_link_expires_at: "",
    },
  );
}

export async function createStudent(input: StudentInput) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const payload = toStudentDocument(input);

  if (input.telegramChatId.trim()) {
    payload.telegram_link_token = "";
    payload.telegram_linked_at = new Date().toISOString();
  }

  return appwrite.databases.createDocument(
    appwrite.databaseId,
    config.collections.students,
    ID.unique(),
    payload,
  );
}

export async function updateStudent(studentId: string, input: StudentInput) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const currentStudent = await getStudent(studentId);

  if (!currentStudent) {
    throw new Error("Карточка ученика не найдена.");
  }

  const payload = toStudentDocument(input);
  const nextChatId = input.telegramChatId.trim();

  if (nextChatId) {
    payload.telegram_link_token = "";
    payload.telegram_linked_at =
      nextChatId === currentStudent.telegramChatId &&
      currentStudent.telegramLinkedAt
        ? currentStudent.telegramLinkedAt
        : new Date().toISOString();
  } else if (currentStudent.telegramChatId) {
    payload.telegram_link_token = "";
    payload.telegram_linked_at = "";
  }

  return appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.students,
    studentId,
    payload,
  );
}

export async function deleteStudent(studentId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const projectsResponse = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.projects,
    [Query.equal("student_id", studentId), Query.limit(500)],
  );

  for (const project of projectsResponse.documents) {
    await deleteProjectCascade(project.$id);
  }

  const attendanceResponse = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.attendance,
    [Query.equal("student_id", studentId), Query.limit(1000)],
  );

  for (const attendance of attendanceResponse.documents) {
    await appwrite.databases.deleteDocument(
      appwrite.databaseId,
      config.collections.attendance,
      attendance.$id,
    );
  }

  return appwrite.databases.deleteDocument(
    appwrite.databaseId,
    config.collections.students,
    studentId,
  );
}

export async function listStudentNameMap() {
  const students = await listStudents();

  return new Map(
    students.map((student) => [
      student.id,
      `${student.firstName} ${student.lastName}`,
    ]),
  );
}
