import "server-only";

import { Query } from "node-appwrite";

import { getAppwriteDatabases } from "@/lib/server/appwrite";
import { mapAttendanceLessonDocument } from "@/lib/server/mappers";
import type { AttendanceLessonRecord } from "@/lib/types";

const LESSONS_COLLECTION_ID =
  process.env.APPWRITE_LESSONS_COLLECTION_ID ?? "lessons";

export async function listAttendanceLessons(): Promise<
  AttendanceLessonRecord[]
> {
  const appwrite = getAppwriteDatabases();

  if (!appwrite) {
    return [];
  }

  try {
    const response = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      LESSONS_COLLECTION_ID,
      [Query.orderAsc("lesson_date")],
    );

    return response.documents.map((document) =>
      mapAttendanceLessonDocument(document),
    );
  } catch {
    return [];
  }
}
