import { Client, Databases, Query } from "node-appwrite";

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

type ImportResult = {
  imported: number;
  failed: number;
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

async function exportCollection(client: Client, collectionId: string) {
  const databases = new Databases(client);
  let offset = 0;
  const limit = 100;
  const allDocuments: unknown[] = [];

  console.log(`Exporting collection: ${collectionId}`);

  while (true) {
    const response = await databases.listDocuments(DATABASE_ID, collectionId, [
      Query.limit(limit),
      Query.offset(offset),
    ]);

    if (response.documents.length === 0) {
      break;
    }

    allDocuments.push(...response.documents);

    console.log(`  Fetched ${allDocuments.length}/${response.total} documents`);

    if (allDocuments.length >= response.total) {
      break;
    }

    offset += response.documents.length;
  }

  console.log(`Exported ${allDocuments.length} documents from ${collectionId}`);
  return allDocuments;
}

async function importCollection(
  client: Client,
  collectionId: string,
  documents: unknown[],
): Promise<ImportResult> {
  const databases = new Databases(client);

  console.log(`Importing ${documents.length} documents to ${collectionId}`);

  let imported = 0;
  let failed = 0;

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i] as Record<string, unknown>;
    try {
      const {
        $id,
        $permissions,
        $createdAt,
        $updatedAt,
        $databaseId,
        $collectionId,
        ...cleanData
      } = doc;

      await databases.createDocument(
        DATABASE_ID,
        collectionId,
        $id as string,
        cleanData,
      );
      imported++;

      if ((i + 1) % 100 === 0) {
        console.log(`  Imported ${i + 1}/${documents.length}`);
      }
    } catch (error) {
      failed++;
      console.error(`Error importing document ${doc.$id}:`, error);
    }
  }

  console.log(
    `Completed import to ${collectionId}: ${imported} imported, ${failed} failed`,
  );

  return { imported, failed };
}

async function main() {
  console.log("Starting Appwrite database migration...\n");

  if (!CLOUD_API_KEY) {
    throw new Error("CLOUD_APPWRITE_API_KEY is required");
  }
  if (!LOCAL_API_KEY) {
    throw new Error("LOCAL_APPWRITE_API_KEY or APPWRITE_API_KEY is required");
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

  const databases = new Databases(localClient);

  try {
    await databases.get(DATABASE_ID);
    console.log(`Local database ${DATABASE_ID} exists`);
  } catch {
    await databases.create(DATABASE_ID, "Projects Tracker");
    console.log(`Created local database ${DATABASE_ID}`);
  }

  let failedCollections = 0;
  let failedDocuments = 0;
  let importedDocuments = 0;

  for (const collectionId of Object.values(COLLECTIONS)) {
    try {
      const documents = await exportCollection(cloudClient, collectionId);
      if (documents.length > 0) {
        const result = await importCollection(
          localClient,
          collectionId,
          documents,
        );
        importedDocuments += result.imported;
        failedDocuments += result.failed;
      } else {
        console.log(`Skipping empty collection: ${collectionId}`);
      }
    } catch (error) {
      failedCollections++;
      console.error(`Error processing collection ${collectionId}:`, error);
    }
  }

  if (failedCollections > 0 || failedDocuments > 0) {
    throw new Error(
      `Migration failed: ${failedCollections} collection(s), ${failedDocuments} document(s).`,
    );
  }

  console.log(
    `\nMigration completed: ${importedDocuments} documents imported.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
