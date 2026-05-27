import { Client, Databases } from "node-appwrite";

const LOCAL_ENDPOINT = "https://aw.note-canopus.ts.net/v1";
const LOCAL_PROJECT_ID = "6a16b1a80039cd5cbb93";
const LOCAL_API_KEY = process.env.LOCAL_APPWRITE_API_KEY;

const DATABASE_ID = "projects-tracker";

const COLLECTIONS = [
  "students",
  "lessons",
  "attendance",
  "projects",
  "project_memberships",
  "project_selection_locks",
  "project_ai_reports",
];

async function clearCollection(
  databases: Databases,
  collectionId: string,
) {
  console.log(`Clearing collection: ${collectionId}`);
  
  let deleted = 0;
  
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
        console.error(`Error deleting document ${doc.$id}:`, error);
      }
    }
    
    console.log(`  Deleted ${deleted} documents so far...`);
  }
  
  console.log(`Cleared ${deleted} documents from ${collectionId}`);
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

  console.log("Clearing local Appwrite database...\n");

  for (const collectionId of COLLECTIONS) {
    try {
      await clearCollection(databases, collectionId);
    } catch (error) {
      console.error(`Error clearing collection ${collectionId}:`, error);
    }
  }

  console.log("\nDatabase cleared!");
}

main().catch(console.error);
