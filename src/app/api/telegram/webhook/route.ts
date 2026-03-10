import { NextResponse } from "next/server";

import {
  handleTelegramStartLinking,
  verifyTelegramWebhookRequest,
} from "@/lib/server/telegram-linking";

export async function POST(request: Request) {
  if (!verifyTelegramWebhookRequest(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const payload = await request.json();
    await handleTelegramStartLinking(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram webhook] Failed to process update:", error);

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
