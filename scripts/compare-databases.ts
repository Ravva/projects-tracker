import { Client, Databases } from "node-appwrite";

const CLOUD_ENDPOINT =
  process.env.CLOUD_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
const CLOUD_PROJECT_ID =
  process.env.CLOUD_APPWRITE_PROJECT_ID ?? "69adc75f001d64b67051";
const CLOUD_API_KEY = process.env.CLOUD_APPWRITE_API_KEY;
const CLOUD_RESPONSE_FORMAT =
  process.env.CLOUD_APPWRITE_RESPONSE_FORMAT ?? "1.9.4";

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

function initClient(
  endpoint: string,
  projectId: string,
  apiKey: string,
  responseFormat: string,
) {
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  client.headers["X-Appwrite-Response-Format"] = responseFormat;

  return client;
}

async function countDocuments(
  databases: Databases,
  collectionId: string,
): Promise<number> {
  const response = await databases.listDocuments(DATABASE_ID, collectionId);
  return response.total;
}

async function main() {
  if (!CLOUD_API_KEY || !LOCAL_API_KEY) {
    throw new Error(
      "CLOUD_APPWRITE_API_KEY and LOCAL_APPWRITE_API_KEY are required",
    );
  }

  const cloudClient = initClient(
    CLOUD_ENDPOINT,
    CLOUD_PROJECT_ID,
    CLOUD_API_KEY,
    CLOUD_RESPONSE_FORMAT,
  );
  const localClient = initClient(
    LOCAL_ENDPOINT,
    LOCAL_PROJECT_ID,
    LOCAL_API_KEY,
    LOCAL_RESPONSE_FORMAT,
  );

  const cloudDb = new Databases(cloudClient);
  const localDb = new Databases(localClient);

  console.log("Comparing cloud vs local databases...\n");
  console.log("Collection".padEnd(25), "Cloud", "Local", "Diff");
  console.log("-".repeat(60));

  let differences = 0;

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

    if (diff !== 0) {
      differences++;
    }
  }

  if (differences > 0) {
    throw new Error(`Database comparison found ${differences} difference(s).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
