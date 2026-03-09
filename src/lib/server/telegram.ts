import "server-only";

/**
 * Сервис для интеграции с Telegram Bot API.
 * Используется для отправки уведомлений ученикам от имени преподавателя.
 */

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

interface TelegramResponse {
  ok: boolean;
  description?: string;
  result?: any;
}

/**
 * Отправляет текстовое сообщение в Telegram пользователю или в чат.
 */
export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!TELEGRAM_TOKEN) {
    console.warn("[Telegram] Токен бота не настроен (TELEGRAM_BOT_TOKEN).");
    return false;
  }

  if (!chatId) {
    console.warn("[Telegram] Попытка отправки сообщения без chatId.");
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });

    const data = (await response.json()) as TelegramResponse;

    if (!data.ok) {
      console.error("[Telegram] Ошибка API:", data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Telegram] Ошибка сети при отправке:", error);
    return false;
  }
}

/**
 * Проверяет, настроен ли бот.
 */
export function isTelegramConfigured(): boolean {
  return !!TELEGRAM_TOKEN;
}
