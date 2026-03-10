"use client";

import {
  Copy01Icon,
  Link01Icon,
  Notification01Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState, useTransition } from "react";

import { issueStudentTelegramInviteAction } from "@/app/students/actions";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import type { TelegramLinkStatus } from "@/lib/types";

interface FeedbackState {
  tone: "success" | "error";
  title: string;
  description: string;
}

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
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const linkedAtLabel = useMemo(() => formatLinkedAt(linkedAt), [linkedAt]);

  const handleCopyLink = async () => {
    if (!currentInviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentInviteLink);
      setFeedback({
        tone: "success",
        title: "Ссылка скопирована",
        description:
          "Приглашение уже в буфере обмена. Теперь его можно отправить ученику в любой удобный канал.",
      });
    } catch {
      setFeedback({
        tone: "error",
        title: "Не удалось скопировать ссылку",
        description:
          "Браузер не дал доступ к буферу обмена. Скопируйте ссылку вручную из карточки после генерации.",
      });
    }
  };

  const handleIssueInvite = () => {
    startTransition(async () => {
      try {
        const result = await issueStudentTelegramInviteAction(studentId);
        setCurrentInviteLink(result.link);
        setFeedback({
          tone: "success",
          title: "Приглашение готово",
          description:
            `Ссылка для ${result.studentName} создана. ` +
            "Отправьте её ученику и попросите нажать Start в боте.",
        });
      } catch (error) {
        setFeedback({
          tone: "error",
          title: "Не удалось выпустить приглашение",
          description:
            error instanceof Error
              ? error.message
              : "При генерации Telegram invite link произошла ошибка.",
        });
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
    <>
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

          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="font-medium">Как это работает</div>
            <ol className="mt-2 space-y-1 text-muted-foreground">
              <li>1. Выпустите персональную ссылку.</li>
              <li>
                2. Отправьте её ученику в Telegram, по телефону или в любом
                мессенджере.
              </li>
              <li>3. Ученик открывает ссылку и нажимает Start.</li>
              <li>4. Бот сам сохранит реальный chat id в карточку.</li>
            </ol>
          </div>

          {currentInviteLink ? (
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="font-medium">Текущая invite-ссылка</div>
              <div className="mt-2 break-all rounded-xl border border-dashed border-border/70 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                {currentInviteLink}
              </div>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
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
            <Button
              type="button"
              variant="outline"
              className="rounded-xl bg-background/90"
              disabled={!currentInviteLink}
              onClick={handleCopyLink}
            >
              <HugeiconsIcon icon={Copy01Icon} size={16} strokeWidth={1.8} />
              Скопировать ссылку
            </Button>
          </div>

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

      <FeedbackModal
        open={feedback !== null}
        tone={feedback?.tone ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
        onClose={() => setFeedback(null)}
      />
    </>
  );
}
