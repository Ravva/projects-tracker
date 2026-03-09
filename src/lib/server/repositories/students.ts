import "server-only";

import { Query } from "node-appwrite";

import { getAppwriteDatabases } from "@/lib/server/appwrite";
import { mapStudentDocument } from "@/lib/server/mappers";
import type { StudentRecord } from "@/lib/types";

const STUDENTS_COLLECTION_ID =
  process.env.APPWRITE_STUDENTS_COLLECTION_ID ?? "students";

export async function listStudents(): Promise<StudentRecord[]> {
  const appwrite = getAppwriteDatabases();

  if (!appwrite) {
    return [];
  }

  try {
    const response = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      STUDENTS_COLLECTION_ID,
      [Query.orderAsc("last_name"), Query.orderAsc("first_name")],
    );

    return response.documents.map((document) => mapStudentDocument(document));
  } catch {
    return [];
  }
}

export async function getStudent(
  studentId: string,
): Promise<StudentRecord | null> {
  const appwrite = getAppwriteDatabases();

  if (!appwrite) {
    return null;
  }

  try {
    const document = await appwrite.databases.getDocument(
      appwrite.databaseId,
      STUDENTS_COLLECTION_ID,
      studentId,
    );

    return mapStudentDocument(document);
  } catch {
    return null;
  }
}
