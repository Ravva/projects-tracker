import "server-only";

import { Client, Databases } from "node-appwrite";

type AppwriteConfig = {
  endpoint: string;
  projectId: string;
  apiKey: string;
  databaseId: string;
  collections: {
    students: string;
    lessons: string;
    attendance: string;
    projects: string;
    projectAiReports: string;
  };
};

const DEFAULT_DATABASE_ID = "projects-tracker";

export function getAppwriteConfig(): AppwriteConfig | null {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID ?? DEFAULT_DATABASE_ID;

  if (!endpoint || !projectId || !apiKey) {
    return null;
  }

  return {
    endpoint,
    projectId,
    apiKey,
    databaseId,
    collections: {
      students: process.env.APPWRITE_STUDENTS_COLLECTION_ID ?? "students",
      lessons: process.env.APPWRITE_LESSONS_COLLECTION_ID ?? "lessons",
      attendance: process.env.APPWRITE_ATTENDANCE_COLLECTION_ID ?? "attendance",
      projects: process.env.APPWRITE_PROJECTS_COLLECTION_ID ?? "projects",
      projectAiReports:
        process.env.APPWRITE_PROJECT_AI_REPORTS_COLLECTION_ID ??
        "project_ai_reports",
    },
  };
}

export function getAppwriteDatabases() {
  const config = getAppwriteConfig();

  if (!config) {
    return null;
  }

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  return {
    databases: new Databases(client),
    databaseId: config.databaseId,
  };
}

export function isAppwriteConfigured() {
  return getAppwriteConfig() !== null;
}
