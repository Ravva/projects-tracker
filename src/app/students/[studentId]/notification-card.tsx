"use client";

import { TelegramIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { sendStudentNotificationAction } from "../actions";

interface NotificationCardProps {
  studentId: string;
  telegramChatId: string;
}

interface FeedbackState {
  tone: "success" | "error";
  title: string;
  description: string;
}

export function NotificationCard({
  studentId,
  telegramChatId,
}: NotificationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const maxLength = 4096;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await sendStudentNotificationAction(formData);
        form.reset();
        setMessage("");
        setFeedback({
          tone: "success",
          title: "Уведомление отправлено",
          description:
            "Telegram принял сообщение. Если у ученика уже был диалог с ботом, оно должно прийти сразу.",
        });
      } catch (error) {
        setFeedback({
          tone: "error",
          title: "Не удалось отправить сообщение",
          description:
            error instanceof Error
              ? error.message
              : "Произошла ошибка при отправке уведомления.",
        });
      }
    });
  };

  return (
    <>
      <Card className="border-border/70 bg-card/88 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon icon={TelegramIcon} size={18} strokeWidth={1.8} />
            Отправить уведомление
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {telegramChatId ? (
            <form onSubmit={handleSubmit} className="space-y-3 font-sans">
              <input type="hidden" name="studentId" value={studentId} />
              <textarea
                name="message"
                required
                value={message}
                maxLength={maxLength}
                placeholder="Введите текст сообщения..."
                className="min-h-24 w-full rounded-md border border-border bg-background/80 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 font-sans resize-none"
                onChange={(event) => setMessage(event.target.value)}
              />
              <div className="flex items-center justify-between gap-3 text-xs font-sans">
                <span className="text-muted-foreground">
                  Telegram принимает до {maxLength} символов в одном сообщении.
                </span>
                <span className="text-muted-foreground">
                  {message.length}/{maxLength}
                </span>
              </div>
              <Button
                type="submit"
                disabled={isPending}
                className="w-full rounded-md font-sans"
              >
                {isPending ? "Отправка..." : "Отправить через бота"}
              </Button>
              <p className="text-[11px] leading-normal italic text-muted-foreground font-sans">
                Сообщение будет доставлено, только если ученик уже нажал
                `/start` в боте и передан корректный chat id.
              </p>
            </form>
          ) : (
            <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-4 text-center font-sans">
              <p className="text-sm text-muted-foreground font-sans">
                Уведомления недоступны, так как у ученика не указан{" "}
                <b>Telegram chat id</b>.
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70 font-sans">
                Ученик должен нажать `/start` в боте и прислать свой числовой ID
                или ID чата.
              </p>
            </div>
          )}
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
