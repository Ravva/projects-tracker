import { Client, Databases } from "node-appwrite";

const CLOUD_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const CLOUD_PROJECT_ID = "69adc75f001d64b67051";
const CLOUD_API_KEY = process.env.CLOUD_APPWRITE_API_KEY;

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

async function countDocuments(
  databases: Databases,
  collectionId: string,
): Promise<number> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      collectionId,
    );
    return response.total;
  } catch (error) {
    console.error(`Error counting ${collectionId}:`, error);
    return 0;
  }
}

async function main() {
  if (!CLOUD_API_KEY || !LOCAL_API_KEY) {
    throw new Error("API keys are required");
  }

  const cloudClient = new Client()
    .setEndpoint(CLOUD_ENDPOINT)
    .setProject(CLOUD_PROJECT_ID)
    .setKey(CLOUD_API_KEY);

  const localClient = new Client()
    .setEndpoint(LOCAL_ENDPOINT)
    .setProject(LOCAL_PROJECT_ID)
    .setKey(LOCAL_API_KEY);

  const cloudDb = new Databases(cloudClient);
  const localDb = new Databases(localClient);

  console.log("Comparing cloud vs local databases...\n");
  console.log("Collection".padEnd(25), "Cloud", "Local", "Diff");
  console.log("-".repeat(60));

  for (const [name, collectionId] of Object.entries(COLLECTIONS)) {
    const cloudCount = await countDocuments(cloudDb, collectionId);
    const localCount = await countDocuments(localDb, collectionId);
    const diff = localCount - cloudCount;
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;

    console.log(
      name.padEnd(25),
      String(cloudCount).padEnd(6),
      String(localCount).padEnd(6),
      diffStr,
    );
  }
}

main().catch(console.error);
