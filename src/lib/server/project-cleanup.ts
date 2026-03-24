import "server-only";

import { Query } from "node-appwrite";

import { getAppwriteConfig, getAppwriteDatabases } from "@/lib/server/appwrite";

async function deleteAllProjectAiReports(projectId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  while (true) {
    const response = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      config.collections.projectAiReports,
      [Query.equal("project_id", projectId), Query.limit(100)],
    );

    if (response.documents.length === 0) {
      break;
    }

    for (const report of response.documents) {
      await appwrite.databases.deleteDocument(
        appwrite.databaseId,
        config.collections.projectAiReports,
        report.$id,
      );
    }

    if (response.documents.length < 100) {
      break;
    }
  }
}

async function deleteAllProjectMemberships(projectId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  while (true) {
    const response = await appwrite.databases.listDocuments(
      appwrite.databaseId,
      config.collections.projectMemberships,
      [Query.equal("project_id", projectId), Query.limit(100)],
    );

    if (response.documents.length === 0) {
      break;
    }

    for (const membership of response.documents) {
      await appwrite.databases.deleteDocument(
        appwrite.databaseId,
        config.collections.projectMemberships,
        membership.$id,
      );
    }

    if (response.documents.length < 100) {
      break;
    }
  }
}

export async function deleteProjectCascade(projectId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  await deleteAllProjectAiReports(projectId);
  await deleteAllProjectMemberships(projectId);

  return appwrite.databases.deleteDocument(
    appwrite.databaseId,
    config.collections.projects,
    projectId,
  );
}
