import { Client, Databases, Query } from "node-appwrite";

const CLOUD_ENDPOINT = process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const CLOUD_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || "69adc75f001d64b67051";
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

async function initClient(endpoint: string, projectId: string, apiKey: string) {
  return new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
}

async function exportCollection(
  client: Client,
  collectionId: string,
) {
  const databases = new Databases(client);
  let offset = 0;
  const limit = 100;
  const allDocuments: unknown[] = [];

  console.log(`Exporting collection: ${collectionId}`);

  while (true) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      collectionId,
      [Query.limit(limit), Query.offset(offset)],
    );

    if (response.documents.length === 0) {
      break;
    }

    allDocuments.push(...response.documents);

    console.log(`  Fetched ${allDocuments.length}/${response.total} documents`);

    // Если получили все документы
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
) {
  const databases = new Databases(client);

  console.log(`Importing ${documents.length} documents to ${collectionId}`);

  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i] as Record<string, unknown>;
    try {
      // Удаляем системные поля, которые не нужны при импорте
      const { $id, $permissions, $createdAt, $updatedAt, $databaseId, $collectionId, ...cleanData } = doc;
      
      await databases.createDocument(
        DATABASE_ID,
        collectionId,
        $id as string,
        cleanData,
      );
      if ((i + 1) % 100 === 0) {
        console.log(`  Imported ${i + 1}/${documents.length}`);
      }
    } catch (error) {
      console.error(`Error importing document ${doc.$id}:`, error);
    }
  }

  console.log(`Completed import to ${collectionId}`);
}

async function main() {
  console.log("Starting Appwrite database migration...\n");

  if (!CLOUD_API_KEY) {
    throw new Error("CLOUD_APPWRITE_API_KEY is required");
  }
  if (!LOCAL_API_KEY) {
    throw new Error("LOCAL_APPWRITE_API_KEY is required");
  }

  const cloudClient = await initClient(
    CLOUD_ENDPOINT,
    CLOUD_PROJECT_ID,
    CLOUD_API_KEY,
  );
  const localClient = await initClient(
    LOCAL_ENDPOINT,
    LOCAL_PROJECT_ID,
    LOCAL_API_KEY,
  );

  const databases = new Databases(localClient);

  try {
    await databases.get(DATABASE_ID);
    console.log(`Local database ${DATABASE_ID} exists`);
  } catch {
    await databases.create(DATABASE_ID, "Projects Tracker");
    console.log(`Created local database ${DATABASE_ID}`);
  }

  const collectionIds = Object.values(COLLECTIONS);

  for (const collectionId of collectionIds) {
    try {
      const documents = await exportCollection(cloudClient, collectionId);
      if (documents.length > 0) {
        await importCollection(localClient, collectionId, documents);
      } else {
        console.log(`Skipping empty collection: ${collectionId}`);
      }
    } catch (error) {
      console.error(`Error processing collection ${collectionId}:`, error);
    }
  }

  console.log("\nMigration completed!");
}

main().catch(console.error);
