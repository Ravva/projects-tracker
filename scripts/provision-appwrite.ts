import {
  AppwriteException,
  Client,
  Databases,
  IndexType,
  OrderBy,
} from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID ?? "projects-tracker";

if (!endpoint || !projectId || !apiKey) {
  throw new Error(
    "APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID и APPWRITE_API_KEY обязательны.",
  );
}

const collections = {
  students: process.env.APPWRITE_STUDENTS_COLLECTION_ID ?? "students",
  lessons: process.env.APPWRITE_LESSONS_COLLECTION_ID ?? "lessons",
  attendance: process.env.APPWRITE_ATTENDANCE_COLLECTION_ID ?? "attendance",
  projects: process.env.APPWRITE_PROJECTS_COLLECTION_ID ?? "projects",
  projectAiReports:
    process.env.APPWRITE_PROJECT_AI_REPORTS_COLLECTION_ID ??
    "project_ai_reports",
};

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);
const databases = new Databases(client);

type StringAttributeDefinition = {
  type: "string";
  collectionId: string;
  key: string;
  size: number;
  required: boolean;
  xdefault?: string;
};

type BooleanAttributeDefinition = {
  type: "boolean";
  collectionId: string;
  key: string;
  required: boolean;
  xdefault?: boolean;
};

type IntegerAttributeDefinition = {
  type: "integer";
  collectionId: string;
  key: string;
  required: boolean;
  min?: number;
  max?: number;
  xdefault?: number;
};

type AttributeDefinition =
  | StringAttributeDefinition
  | BooleanAttributeDefinition
  | IntegerAttributeDefinition;

type IndexDefinition = {
  collectionId: string;
  key: string;
  attributes: string[];
  orders: OrderBy[];
};

const attributeDefinitions: AttributeDefinition[] = [
  {
    type: "string",
    collectionId: collections.students,
    key: "first_name",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.students,
    key: "last_name",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.students,
    key: "github_username",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.students,
    key: "github_user_id",
    size: 255,
    required: false,
    xdefault: "",
  },
  {
    type: "string",
    collectionId: collections.students,
    key: "telegram_username",
    size: 255,
    required: false,
    xdefault: "",
  },
  {
    type: "string",
    collectionId: collections.students,
    key: "telegram_chat_id",
    size: 255,
    required: false,
    xdefault: "",
  },
  {
    type: "string",
    collectionId: collections.students,
    key: "notes",
    size: 10000,
    required: false,
    xdefault: "",
  },
  {
    type: "string",
    collectionId: collections.lessons,
    key: "title",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.lessons,
    key: "lesson_date",
    size: 32,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.lessons,
    key: "lesson_week_start",
    size: 32,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.lessons,
    key: "weekday_code",
    size: 16,
    required: true,
  },
  {
    type: "boolean",
    collectionId: collections.lessons,
    key: "is_generated",
    required: true,
  },
  {
    type: "boolean",
    collectionId: collections.lessons,
    key: "is_closed",
    required: true,
  },
  {
    type: "string",
    collectionId: collections.attendance,
    key: "student_id",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.attendance,
    key: "lesson_id",
    size: 255,
    required: true,
  },
  {
    type: "boolean",
    collectionId: collections.attendance,
    key: "present",
    required: true,
  },
  {
    type: "string",
    collectionId: collections.attendance,
    key: "lesson_week_start",
    size: 32,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.projects,
    key: "student_id",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.projects,
    key: "name",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.projects,
    key: "summary",
    size: 2000,
    required: false,
    xdefault: "",
  },
  {
    type: "string",
    collectionId: collections.projects,
    key: "github_url",
    size: 1000,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.projects,
    key: "status",
    size: 64,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.projects,
    key: "spec_markdown",
    size: 4000,
    required: false,
    xdefault: "",
  },
  {
    type: "string",
    collectionId: collections.projects,
    key: "plan_markdown",
    size: 4000,
    required: false,
    xdefault: "",
  },
  {
    type: "string",
    collectionId: collections.projects,
    key: "github_state_json",
    size: 2000,
    required: false,
    xdefault: "{}",
  },
  {
    type: "string",
    collectionId: collections.projects,
    key: "project_state_json",
    size: 2000,
    required: false,
    xdefault: "{}",
  },
  {
    type: "string",
    collectionId: collections.projectAiReports,
    key: "project_id",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.projectAiReports,
    key: "source_commit_sha",
    size: 255,
    required: false,
    xdefault: "",
  },
  {
    type: "string",
    collectionId: collections.projectAiReports,
    key: "analysis_version",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.projectAiReports,
    key: "model_name",
    size: 255,
    required: true,
  },
  {
    type: "string",
    collectionId: collections.projectAiReports,
    key: "summary",
    size: 2000,
    required: true,
  },
  {
    type: "integer",
    collectionId: collections.projectAiReports,
    key: "completion_percent",
    required: true,
    min: 0,
    max: 100,
  },
  {
    type: "string",
    collectionId: collections.projectAiReports,
    key: "report_payload_json",
    size: 12000,
    required: false,
    xdefault: "{}",
  },
];

const indexDefinitions: IndexDefinition[] = [
  {
    collectionId: collections.lessons,
    key: "lessons_by_week",
    attributes: ["lesson_week_start", "lesson_date"],
    orders: [OrderBy.Asc, OrderBy.Asc],
  },
  {
    collectionId: collections.attendance,
    key: "attendance_by_lesson",
    attributes: ["lesson_id", "student_id"],
    orders: [OrderBy.Asc, OrderBy.Asc],
  },
  {
    collectionId: collections.projects,
    key: "projects_by_student",
    attributes: ["student_id", "$updatedAt"],
    orders: [OrderBy.Asc, OrderBy.Desc],
  },
  {
    collectionId: collections.projectAiReports,
    key: "reports_by_project",
    attributes: ["project_id", "$createdAt"],
    orders: [OrderBy.Asc, OrderBy.Desc],
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDatabase() {
  try {
    await databases.get(databaseId);
    console.log(`Database ${databaseId} already exists`);
  } catch {
    await databases.create(databaseId, "Projects Tracker");
    console.log(`Created database ${databaseId}`);
  }
}

async function ensureCollection(collectionId: string, name: string) {
  try {
    await databases.getCollection(databaseId, collectionId);
    console.log(`Collection ${collectionId} already exists`);
  } catch {
    await databases.createCollection(databaseId, collectionId, name);
    console.log(`Created collection ${collectionId}`);
  }
}

async function listAttributeKeys(collectionId: string) {
  const response = await databases.listAttributes(databaseId, collectionId);

  return new Set(response.attributes.map((attribute) => attribute.key));
}

async function waitForAttribute(collectionId: string, key: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const attribute = await databases.getAttribute(
        databaseId,
        collectionId,
        key,
      );

      if (attribute.status === "available") {
        return;
      }
    } catch {}

    await sleep(500);
  }
}

async function createAttribute(definition: AttributeDefinition) {
  if (definition.type === "string") {
    await databases.createStringAttribute(
      databaseId,
      definition.collectionId,
      definition.key,
      definition.size,
      definition.required,
      definition.xdefault,
    );
    return;
  }

  if (definition.type === "boolean") {
    await databases.createBooleanAttribute(
      databaseId,
      definition.collectionId,
      definition.key,
      definition.required,
      definition.xdefault,
    );
    return;
  }

  await databases.createIntegerAttribute(
    databaseId,
    definition.collectionId,
    definition.key,
    definition.required,
    definition.min,
    definition.max,
    definition.xdefault,
  );
}

async function ensureAttributes() {
  const grouped = new Map<string, AttributeDefinition[]>();

  for (const definition of attributeDefinitions) {
    const list = grouped.get(definition.collectionId) ?? [];
    list.push(definition);
    grouped.set(definition.collectionId, list);
  }

  for (const [collectionId, definitions] of grouped) {
    const existingKeys = await listAttributeKeys(collectionId);

    for (const definition of definitions) {
      if (existingKeys.has(definition.key)) {
        continue;
      }

      try {
        await createAttribute(definition);
        await waitForAttribute(collectionId, definition.key);
        console.log(`Created attribute ${collectionId}.${definition.key}`);
      } catch (error) {
        if (
          error instanceof AppwriteException &&
          (error.code === 409 || error.type.includes("already_exists"))
        ) {
          continue;
        }

        throw error;
      }
    }
  }
}

async function ensureIndexes() {
  for (const index of indexDefinitions) {
    try {
      await databases.createIndex(
        databaseId,
        index.collectionId,
        index.key,
        IndexType.Key,
        index.attributes,
        index.orders,
      );
      console.log(`Created index ${index.collectionId}.${index.key}`);
    } catch (error) {
      if (
        error instanceof AppwriteException &&
        (error.code === 409 || error.type.includes("already_exists"))
      ) {
        continue;
      }

      throw error;
    }
  }
}

await ensureDatabase();
await ensureCollection(collections.students, "Students");
await ensureCollection(collections.lessons, "Lessons");
await ensureCollection(collections.attendance, "Attendance");
await ensureCollection(collections.projects, "Projects");
await ensureCollection(collections.projectAiReports, "Project AI Reports");
await ensureAttributes();
await ensureIndexes();

console.log("Appwrite provisioning completed");
