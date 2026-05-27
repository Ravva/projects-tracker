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

const COLLECTIONS = [
  process.env.APPWRITE_STUDENTS_COLLECTION_ID ?? "students",
  process.env.APPWRITE_LESSONS_COLLECTION_ID ?? "lessons",
  process.env.APPWRITE_ATTENDANCE_COLLECTION_ID ?? "attendance",
  process.env.APPWRITE_PROJECTS_COLLECTION_ID ?? "projects",
  process.env.APPWRITE_PROJECT_MEMBERSHIPS_COLLECTION_ID ??
    "project_memberships",
  process.env.APPWRITE_PROJECT_SELECTION_LOCKS_COLLECTION_ID ??
    "project_selection_locks",
  process.env.APPWRITE_PROJECT_AI_REPORTS_COLLECTION_ID ?? "project_ai_reports",
];

function initClient(endpoint: string, projectId: string, apiKey: string) {
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  client.headers["X-Appwrite-Response-Format"] = LOCAL_RESPONSE_FORMAT;

  return client;
}

async function clearCollection(databases: Databases, collectionId: string) {
  console.log(`Clearing collection: ${collectionId}`);

  let deleted = 0;
  let failed = 0;

  while (true) {
    const response = await databases.listDocuments(DATABASE_ID, collectionId);

    if (response.documents.length === 0) {
      break;
    }

    for (const doc of response.documents) {
      try {
        await databases.deleteDocument(DATABASE_ID, collectionId, doc.$id);
        deleted++;
      } catch (error) {
        failed++;
        console.error(`Error deleting document ${doc.$id}:`, error);
      }
    }

    console.log(`  Deleted ${deleted} documents so far...`);
  }

  if (failed > 0) {
    throw new Error(
      `Failed to delete ${failed} document(s) from ${collectionId}.`,
    );
  }

  console.log(`Cleared ${deleted} documents from ${collectionId}`);
}

async function main() {
  if (!LOCAL_API_KEY) {
    throw new Error("LOCAL_APPWRITE_API_KEY or APPWRITE_API_KEY is required");
  }

  const client = initClient(LOCAL_ENDPOINT, LOCAL_PROJECT_ID, LOCAL_API_KEY);
  const databases = new Databases(client);

  console.log("Clearing local Appwrite database...\n");

  let failures = 0;

  for (const collectionId of COLLECTIONS) {
    try {
      await clearCollection(databases, collectionId);
    } catch (error) {
      failures++;
      console.error(`Error clearing collection ${collectionId}:`, error);
    }
  }

  if (failures > 0) {
    throw new Error(`Database clear failed for ${failures} collection(s).`);
  }

  console.log("\nDatabase cleared!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
