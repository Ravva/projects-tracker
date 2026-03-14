"use client";

import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  Link01Icon,
  Notification01Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { issueStudentTelegramInviteAction } from "@/app/students/actions";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TelegramLinkStatus } from "@/lib/types";

interface TelegramLinkCardProps {
  studentId: string;
  status: TelegramLinkStatus;
  inviteLink: string | null;
  telegramChatId: string;
  linkedAt: string;
}

function formatLinkedAt(value: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export function TelegramLinkCard({
  studentId,
  status,
  inviteLink,
  telegramChatId,
  linkedAt,
}: TelegramLinkCardProps) {
  const [isPending, startTransition] = useTransition();
  const [currentInviteLink, setCurrentInviteLink] = useState(inviteLink);
  const [copySucceeded, setCopySucceeded] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);
  const [inlineTone, setInlineTone] = useState<"success" | "error" | null>(
    null,
  );
  const linkedAtLabel = useMemo(() => formatLinkedAt(linkedAt), [linkedAt]);

  useEffect(() => {
    if (!copySucceeded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopySucceeded(false);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copySucceeded]);

  const handleCopyLink = async () => {
    if (!currentInviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentInviteLink);
      setCopySucceeded(true);
      setInlineTone("success");
      setInlineMessage(
        "Ссылка скопирована. Теперь её можно сразу отправить ученику.",
      );
    } catch {
      setCopySucceeded(false);
      setInlineTone("error");
      setInlineMessage(
        "Браузер не дал доступ к буферу обмена. Скопируйте ссылку вручную из карточки.",
      );
    }
  };

  const handleIssueInvite = () => {
    startTransition(async () => {
      try {
        const result = await issueStudentTelegramInviteAction(studentId);
        setCurrentInviteLink(result.link);
        setCopySucceeded(false);
        setInlineTone("success");
        setInlineMessage(
          `Ссылка для ${result.studentName} готова. Скопируйте её и отправьте ученику.`,
        );
      } catch (error) {
        setInlineTone("error");
        setInlineMessage(
          error instanceof Error
            ? error.message
            : "При генерации Telegram invite link произошла ошибка.",
        );
      }
    });
  };

  const statusLabel =
    status === "linked"
      ? "привязан"
      : status === "awaiting_start"
        ? "ждёт Start"
        : "не приглашён";
  const statusTone =
    status === "linked"
      ? "success"
      : status === "awaiting_start"
        ? "warning"
        : "critical";

  return (
    <Card className="border-border/70 bg-card/88 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={Link01Icon} size={18} strokeWidth={1.8} />
          Telegram link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
          <div>
            <div className="font-medium">Статус привязки</div>
            <div className="mt-1 text-muted-foreground">
              {status === "linked"
                ? "Чат уже привязан к карточке ученика."
                : status === "awaiting_start"
                  ? "Приглашение уже выпущено. Ждём, когда ученик нажмёт Start."
                  : "Для этой карточки ещё не выпускалась персональная ссылка."}
            </div>
          </div>
          <StatusPill tone={statusTone} label={statusLabel} />
        </div>

        {currentInviteLink ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Текущая invite-ссылка</div>
                <div className="mt-2 break-all rounded-xl border border-dashed border-border/70 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                  {currentInviteLink}
                </div>
              </div>
              <button
                type="button"
                aria-label={
                  copySucceeded ? "Ссылка скопирована" : "Скопировать ссылку"
                }
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/90 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!currentInviteLink}
                onClick={handleCopyLink}
              >
                <HugeiconsIcon
                  icon={copySucceeded ? CheckmarkCircle02Icon : Copy01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-2">
          <Button
            type="button"
            className="rounded-xl"
            disabled={isPending || status === "linked"}
            onClick={handleIssueInvite}
          >
            <HugeiconsIcon
              icon={currentInviteLink ? Refresh01Icon : Notification01Icon}
              size={16}
              strokeWidth={1.8}
            />
            {isPending
              ? "Готовим ссылку..."
              : currentInviteLink
                ? "Перевыпустить ссылку"
                : "Выпустить ссылку"}
          </Button>
        </div>

        {inlineMessage ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              inlineTone === "error"
                ? "border-destructive/25 bg-destructive/8 text-destructive"
                : "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))]"
            }`}
          >
            {inlineMessage}
          </div>
        ) : null}

        <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-muted-foreground">
          {status === "linked" ? (
            <>
              <div>Telegram chat id: {telegramChatId}</div>
              {linkedAtLabel ? (
                <div className="mt-1">Привязан: {linkedAtLabel}</div>
              ) : null}
            </>
          ) : (
            "Пока chat id не привязан. Username остаётся справочным полем и не используется как ключ доставки."
          )}
        </div>
      </CardContent>
    </Card>
  );
}
