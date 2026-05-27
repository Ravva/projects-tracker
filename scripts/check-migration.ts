import { Client, Databases } from "node-appwrite";

const LOCAL_ENDPOINT = "https://aw.note-canopus.ts.net/v1";
const LOCAL_PROJECT_ID = "6a16b1a80039cd5cbb93";
const LOCAL_API_KEY = process.env.LOCAL_APPWRITE_API_KEY;

const DATABASE_ID = "projects-tracker";

const COLLECTIONS = {
  students: "students",
  lessons: "lessons",
  attendance: "attendance",
  projects: "projects",
  projectMemberships: "project_memberships",
  projectSelectionLocks: "project_selection_locks",
  projectAiReports: "project_ai_reports",
};

async function checkCollection(
  databases: Databases,
  collectionId: string,
  collectionName: string,
) {
  try {
    const response = await databases.listDocuments(DATABASE_ID, collectionId);
    console.log(
      `✓ ${collectionName}: ${response.total} documents (showing ${response.documents.length})`,
    );
    return response.total;
  } catch (error) {
    console.error(`✗ ${collectionName}: Error -`, error);
    return 0;
  }
}

async function main() {
  if (!LOCAL_API_KEY) {
    throw new Error("LOCAL_APPWRITE_API_KEY is required");
  }

  const client = new Client()
    .setEndpoint(LOCAL_ENDPOINT)
    .setProject(LOCAL_PROJECT_ID)
    .setKey(LOCAL_API_KEY);

  const databases = new Databases(client);

  console.log("Checking local Appwrite database...\n");

  let total = 0;

  for (const [key, collectionId] of Object.entries(COLLECTIONS)) {
    const count = await checkCollection(databases, collectionId, key);
    total += count;
  }

  console.log(`\nTotal documents: ${total}`);
}

main().catch(console.error);
