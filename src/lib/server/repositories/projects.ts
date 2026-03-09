import "server-only";

import { Query } from "node-appwrite";

import { getAppwriteDatabases } from "@/lib/server/appwrite";
import { mapProjectDocument } from "@/lib/server/mappers";
import type { ProjectRecord } from "@/lib/types";

const PROJECTS_COLLECTION_ID =
  process.env.APPWRITE_PROJECTS_COLLECTION_ID ?? "projects";

export async function listProjects(): Promise<ProjectRecord[]> {
  const appwrite = getAppwriteDatabases();

  if (!appwrite) {
    return [];
  }

  try {
    const response = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      PROJECTS_COLLECTION_ID,
      [Query.orderDesc("$updatedAt")],
    );

    return response.documents.map((document) => mapProjectDocument(document));
  } catch {
    return [];
  }
}

export async function getProject(
  projectId: string,
): Promise<ProjectRecord | null> {
  const appwrite = getAppwriteDatabases();

  if (!appwrite) {
    return null;
  }

  try {
    const document = await appwrite.databases.getDocument(
      appwrite.databaseId,
      PROJECTS_COLLECTION_ID,
      projectId,
    );

    return mapProjectDocument(document);
  } catch {
    return null;
  }
}
