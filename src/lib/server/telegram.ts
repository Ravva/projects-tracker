import "server-only";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_MESSAGE_LIMIT = 4096;

export const TELEGRAM_CHAT_ID_PATTERN = /^-?\d+$/;

export type TelegramSendResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "not_configured"
        | "invalid_chat_id"
        | "empty_message"
        | "message_too_long"
        | "telegram_api_error"
        | "network_error";
      message: string;
    };

interface TelegramResponse {
  ok: boolean;
  description?: string;
  result?: unknown;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<TelegramSendResult> {
  if (!TELEGRAM_TOKEN) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN is not configured.");
    return {
      ok: false,
      code: "not_configured",
      message:
        "TELEGRAM_BOT_TOKEN не настроен. Проверьте переменные окружения.",
    };
  }

  if (!chatId || !TELEGRAM_CHAT_ID_PATTERN.test(chatId)) {
    console.warn("[Telegram] Invalid or empty chat_id.");
    return {
      ok: false,
      code: "invalid_chat_id",
      message:
        "Telegram chat id должен содержать только цифры и может начинаться с '-'.",
    };
  }

  if (!text.trim()) {
    return {
      ok: false,
      code: "empty_message",
      message: "Сообщение не может быть пустым.",
    };
  }

  if (text.length > TELEGRAM_MESSAGE_LIMIT) {
    return {
      ok: false,
      code: "message_too_long",
      message: `Сообщение превышает лимит Telegram: ${TELEGRAM_MESSAGE_LIMIT} символов.`,
    };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      },
    );

    const data = (await response.json()) as TelegramResponse;

    if (!data.ok) {
      console.error("[Telegram] API error:", data.description);
      return {
        ok: false,
        code: "telegram_api_error",
        message:
          data.description ??
          "Telegram API отклонил запрос. Проверьте chat id и убедитесь, что ученик нажал /start в боте.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("[Telegram] Network error:", error);
    return {
      ok: false,
      code: "network_error",
      message:
        "Не удалось связаться с Telegram API. Проверьте сеть и доступность сервиса.",
    };
  }
}

export function isTelegramConfigured(): boolean {
  return !!TELEGRAM_TOKEN;
}
