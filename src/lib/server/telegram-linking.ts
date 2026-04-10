import "server-only";

import crypto from "node:crypto";

import { Query } from "node-appwrite";

import { getAppwriteConfig, getAppwriteDatabases } from "@/lib/server/appwrite";
import {
  claimStudentGithubIdentity,
  getStudent,
  getStudentByGithubUserId,
  resetStudentGithubIdentity,
} from "@/lib/server/repositories/students";
import { sendTelegramMessage } from "@/lib/server/telegram";

const TELEGRAM_BOT_USERNAME = (
  process.env.TELEGRAM_BOT_USERNAME?.trim() ?? ""
).replace(/^@/, "");
const TELEGRAM_WEBHOOK_SECRET =
  process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
const APP_BASE_URL = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "") ?? "";

export interface TelegramLinkSession {
  studentId: string;
  studentName: string;
  chatId: string;
  telegramUsername: string;
}

type StudentGithubLinkResult =
  | { ok: true; studentId: string; studentName: string; alreadyLinked: boolean }
  | { ok: false; code: "expired" | "invalid" | "occupied" | "mismatch" };

interface TelegramBotProfileResponse {
  ok: boolean;
  description?: string;
  result?: {
    username?: string;
  };
}

interface TelegramWebhookMessage {
  message?: {
    text?: string;
    chat?: {
      id?: number;
      type?: string;
    };
    from?: {
      username?: string;
    };
  };
}

function getTelegramToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";

  if (!token) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN не настроен. Привязка через Telegram пока недоступна.",
    );
  }

  return token;
}

function buildStudentName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function createGithubLinkExpiryIso() {
  const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24);
  return expiry.toISOString();
}

function isGithubLinkExpired(value: string) {
  if (!value) {
    return true;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return true;
  }

  return parsed.getTime() < Date.now();
}

export function createTelegramLinkToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export function parseTelegramStartToken(text: string) {
  const trimmed = text.trim();

  if (!trimmed.startsWith("/start")) {
    return "";
  }

  const token = trimmed
    .replace(/^\/start(?:@\w+)?/i, "")
    .trim()
    .split(/\s+/)[0];

  return token ?? "";
}

export function verifyTelegramWebhookRequest(request: Request) {
  if (!TELEGRAM_WEBHOOK_SECRET) {
    return false;
  }

  return (
    request.headers.get("x-telegram-bot-api-secret-token") ===
    TELEGRAM_WEBHOOK_SECRET
  );
}

export async function getTelegramBotUsername() {
  if (TELEGRAM_BOT_USERNAME) {
    return TELEGRAM_BOT_USERNAME;
  }

  const token = getTelegramToken();
  const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = (await response.json()) as TelegramBotProfileResponse;
  const username = data.result?.username?.trim() ?? "";

  if (!data.ok || !username) {
    throw new Error(
      data.description ??
        "Не удалось получить username бота. Проверьте TELEGRAM_BOT_TOKEN.",
    );
  }

  return username;
}

export async function buildTelegramInviteLink(token: string) {
  if (!token) {
    return "";
  }

  const username = await getTelegramBotUsername();
  return `https://t.me/${username}?start=${token}`;
}

export function buildStudentGithubLoginPath(token: string) {
  return `/login?studentLinkToken=${encodeURIComponent(token)}`;
}

export function buildStudentGithubCallbackPath(token: string) {
  return `/student/link?token=${encodeURIComponent(token)}`;
}

export function buildStudentGithubLinkUrl(token: string) {
  if (!token || !APP_BASE_URL) {
    return "";
  }

  return `${APP_BASE_URL}${buildStudentGithubLoginPath(token)}`;
}

export async function issueStudentTelegramInvite(studentId: string) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const student = await getStudent(studentId);

  if (!appwrite || !config || !student) {
    throw new Error("Карточка ученика не найдена.");
  }

  if (student.telegramChatId) {
    throw new Error(
      "У ученика уже привязан Telegram chat id. Если нужна перепривязка, сначала очистите текущий chat id вручную.",
    );
  }

  const token = createTelegramLinkToken();

  await appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.students,
    studentId,
    {
      telegram_link_token: token,
      telegram_linked_at: "",
      github_link_token: "",
      github_link_expires_at: "",
    },
  );

  return {
    link: await buildTelegramInviteLink(token),
    token,
    studentName: buildStudentName(student.firstName, student.lastName),
  };
}

export async function issueStudentGithubLink(
  studentId: string,
  options?: { resetCurrentIdentity?: boolean },
) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const student = await getStudent(studentId);

  if (!appwrite || !config || !student) {
    throw new Error("Карточка ученика не найдена.");
  }

  if (!student.telegramChatId) {
    throw new Error(
      "Сначала привяжите Telegram chat id. Без этого перевыпуск GitHub-ссылки небезопасен.",
    );
  }

  if (!APP_BASE_URL) {
    throw new Error(
      "NEXTAUTH_URL не настроен. Невозможно выпустить GitHub-ссылку для ученика.",
    );
  }

  if (options?.resetCurrentIdentity) {
    await resetStudentGithubIdentity(studentId);
  }

  const token = createTelegramLinkToken();

  await appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.students,
    studentId,
    {
      github_link_token: token,
      github_link_expires_at: createGithubLinkExpiryIso(),
    },
  );

  return {
    link: buildStudentGithubLinkUrl(token),
    studentName: buildStudentName(student.firstName, student.lastName),
    resetApplied: Boolean(options?.resetCurrentIdentity),
  };
}

export async function getStudentTelegramInviteLink(studentId: string) {
  const student = await getStudent(studentId);

  if (!student || !student.telegramLinkToken) {
    return null;
  }

  return buildTelegramInviteLink(student.telegramLinkToken);
}

export async function claimStudentTelegramLinkByToken(input: {
  token: string;
  chatId: string;
  telegramUsername: string;
}) {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();

  if (!appwrite || !config) {
    throw new Error("Appwrite не настроен.");
  }

  const response = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.students,
    [Query.equal("telegram_link_token", input.token), Query.limit(2)],
  );
  const student = response.documents[0];

  if (!student) {
    return null;
  }

  const studentId = student.$id;
  const firstName = String(
    (student as Record<string, unknown>).first_name ?? "",
  );
  const lastName = String((student as Record<string, unknown>).last_name ?? "");
  const existingTelegramUsername = String(
    (student as Record<string, unknown>).telegram_username ?? "",
  );
  const githubLinkToken = createTelegramLinkToken();

  await appwrite.databases.updateDocument(
    appwrite.databaseId,
    config.collections.students,
    studentId,
    {
      telegram_chat_id: input.chatId,
      telegram_username: input.telegramUsername || existingTelegramUsername,
      telegram_link_token: "",
      telegram_linked_at: new Date().toISOString(),
      github_link_token: githubLinkToken,
      github_link_expires_at: createGithubLinkExpiryIso(),
    },
  );

  return {
    studentId,
    studentName: buildStudentName(firstName, lastName),
    githubLinkToken,
  };
}

export async function claimStudentGithubLinkByToken(input: {
  token: string;
  githubUserId: string;
  githubUsername: string;
}): Promise<StudentGithubLinkResult> {
  const appwrite = getAppwriteDatabases();
  const config = getAppwriteConfig();
  const normalizedToken = input.token.trim();
  const normalizedGithubUserId = input.githubUserId.trim();

  if (!appwrite || !config || !normalizedToken || !normalizedGithubUserId) {
    return { ok: false, code: "invalid" };
  }

  const response = await appwrite.databases.listDocuments(
    appwrite.databaseId,
    config.collections.students,
    [Query.equal("github_link_token", normalizedToken), Query.limit(2)],
  );
  const student = response.documents[0];

  if (!student) {
    return { ok: false, code: "invalid" };
  }

  const studentId = student.$id;
  const studentName = buildStudentName(
    String((student as Record<string, unknown>).first_name ?? ""),
    String((student as Record<string, unknown>).last_name ?? ""),
  );
  const currentGithubUserId = String(
    (student as Record<string, unknown>).github_user_id ?? "",
  );
  const expiresAt = String(
    (student as Record<string, unknown>).github_link_expires_at ?? "",
  );

  if (isGithubLinkExpired(expiresAt)) {
    await appwrite.databases.updateDocument(
      appwrite.databaseId,
      config.collections.students,
      studentId,
      {
        github_link_token: "",
        github_link_expires_at: "",
      },
    );

    return { ok: false, code: "expired" };
  }

  if (currentGithubUserId && currentGithubUserId !== normalizedGithubUserId) {
    return { ok: false, code: "mismatch" };
  }

  const existingStudent = await getStudentByGithubUserId(
    normalizedGithubUserId,
  );

  if (existingStudent && existingStudent.id !== studentId) {
    return { ok: false, code: "occupied" };
  }

  await claimStudentGithubIdentity({
    studentId,
    githubUserId: normalizedGithubUserId,
    githubUsername: input.githubUsername,
  });

  return {
    ok: true,
    studentId,
    studentName,
    alreadyLinked: currentGithubUserId === normalizedGithubUserId,
  };
}

export async function handleTelegramStartLinking(
  update: TelegramWebhookMessage,
) {
  const message = update.message;
  const text = message?.text?.trim() ?? "";
  const chatId = String(message?.chat?.id ?? "").trim();
  const chatType = message?.chat?.type ?? "";
  const telegramUsername = message?.from?.username?.trim() ?? "";

  if (!text.startsWith("/start")) {
    return { handled: false as const };
  }

  if (!chatId) {
    return { handled: true as const };
  }

  if (chatType && chatType !== "private") {
    await sendTelegramMessage(
      chatId,
      "Откройте личную ссылку в приватном чате с ботом. Привязка chat id не выполняется из группы.",
    );

    return { handled: true as const };
  }

  const token = parseTelegramStartToken(text);

  if (!token) {
    await sendTelegramMessage(
      chatId,
      "Откройте персональную ссылку от преподавателя и нажмите Start ещё раз. В этой команде не найден токен привязки.",
    );

    return { handled: true as const };
  }

  const linked = await claimStudentTelegramLinkByToken({
    token,
    chatId,
    telegramUsername,
  });

  if (!linked) {
    await sendTelegramMessage(
      chatId,
      "Эта ссылка устарела или недействительна. Попросите преподавателя перевыпустить приглашение в Projects Tracker.",
    );

    return { handled: true as const };
  }

  const githubLink = buildStudentGithubLinkUrl(linked.githubLinkToken);

  await sendTelegramMessage(
    chatId,
    [
      `Привязка Telegram выполнена для ${linked.studentName}.`,
      "",
      githubLink
        ? `Теперь войдите через GitHub по ссылке: ${githubLink}`
        : "Теперь войдите в Projects Tracker через GitHub. Ссылка входа недоступна, потому что не задан NEXTAUTH_URL.",
      "",
      "После входа система свяжет ваш GitHub-аккаунт с карточкой ученика и откроет выбор проекта.",
    ].join("\n"),
  );

  return {
    handled: true as const,
    studentName: linked.studentName,
  };
}
