import { Client, Databases } from "node-appwrite";

const LOCAL_ENDPOINT =
  process.env.LOCAL_APPWRITE_ENDPOINT ??
  process.env.APPWRITE_ENDPOINT ??
  "https://aw.note-canopus.ts.net/v1";
const LOCAL_PROJECT_ID =
  process.env.LOCAL_APPWRITE_PROJECT_ID ??
  process.env.APPWRITE_PROJECT_ID ??
  "6a16b1a80039cd5cbb93";
const LOCAL_API_KEY =
  process.env.LOCAL_APPWRITE_API_KEY ?? process.env.APPWRITE_API_KEY;
const LOCAL_RESPONSE_FORMAT =
  process.env.LOCAL_APPWRITE_RESPONSE_FORMAT ??
  process.env.APPWRITE_RESPONSE_FORMAT ??
  "1.9.0";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID ?? "projects-tracker";
const EXPECTED_TOTAL = Number(process.env.APPWRITE_MIGRATION_EXPECTED_TOTAL);

const COLLECTIONS = {
  students: process.env.APPWRITE_STUDENTS_COLLECTION_ID ?? "students",
  lessons: process.env.APPWRITE_LESSONS_COLLECTION_ID ?? "lessons",
  attendance: process.env.APPWRITE_ATTENDANCE_COLLECTION_ID ?? "attendance",
  projects: process.env.APPWRITE_PROJECTS_COLLECTION_ID ?? "projects",
  projectMemberships:
    process.env.APPWRITE_PROJECT_MEMBERSHIPS_COLLECTION_ID ??
    "project_memberships",
  projectSelectionLocks:
    process.env.APPWRITE_PROJECT_SELECTION_LOCKS_COLLECTION_ID ??
    "project_selection_locks",
  projectAiReports:
    process.env.APPWRITE_PROJECT_AI_REPORTS_COLLECTION_ID ??
    "project_ai_reports",
};

type CollectionCheck = {
  count: number;
  ok: boolean;
};

function initClient(endpoint: string, projectId: string, apiKey: string) {
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  client.headers["X-Appwrite-Response-Format"] = LOCAL_RESPONSE_FORMAT;

  return client;
}

async function checkCollection(
  databases: Databases,
  collectionId: string,
  collectionName: string,
): Promise<CollectionCheck> {
  try {
    const response = await databases.listDocuments(DATABASE_ID, collectionId);
    console.log(
      `OK ${collectionName}: ${response.total} documents (showing ${response.documents.length})`,
    );
    return { count: response.total, ok: true };
  } catch (error) {
    console.error(`FAIL ${collectionName}:`, error);
    return { count: 0, ok: false };
  }
}

async function main() {
  if (!LOCAL_API_KEY) {
    throw new Error("LOCAL_APPWRITE_API_KEY or APPWRITE_API_KEY is required");
  }

  const client = initClient(LOCAL_ENDPOINT, LOCAL_PROJECT_ID, LOCAL_API_KEY);
  const databases = new Databases(client);

  console.log("Checking local Appwrite database...\n");

  let total = 0;
  let failures = 0;

  for (const [key, collectionId] of Object.entries(COLLECTIONS)) {
    const { count, ok } = await checkCollection(databases, collectionId, key);
    total += count;

    if (!ok) {
      failures++;
    }
  }

  console.log(`\nTotal documents: ${total}`);

  if (failures > 0) {
    throw new Error(`Migration check failed for ${failures} collection(s).`);
  }

  if (Number.isFinite(EXPECTED_TOTAL) && total !== EXPECTED_TOTAL) {
    throw new Error(
      `Migration check expected ${EXPECTED_TOTAL} documents, got ${total}.`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
