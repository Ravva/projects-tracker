import "server-only";

import { Client, Databases } from "node-appwrite";

type AppwriteConfig = {
  endpoint: string;
  projectId: string;
  apiKey: string;
  databaseId: string;
};

function getAppwriteConfig(): AppwriteConfig | null {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;

  if (!endpoint || !projectId || !apiKey || !databaseId) {
    return null;
  }

  return { endpoint, projectId, apiKey, databaseId };
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
