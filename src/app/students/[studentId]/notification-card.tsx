"use client";

import { TelegramIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendStudentNotificationAction } from "../actions";

interface NotificationCardProps {
  studentId: string;
  telegramChatId: string;
}

export function NotificationCard({
  studentId,
  telegramChatId,
}: NotificationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const maxLength = 4096;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await sendStudentNotificationAction(formData);
        setMessage("");
        event.currentTarget.reset();
        alert("Сообщение успешно отправлено.");
      } catch (error) {
        console.error("Ошибка отправки:", error);
        alert(error instanceof Error ? error.message : "Ошибка при отправке");
      }
    });
  };

  return (
    <Card className="border-border/70 bg-card/88 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={TelegramIcon} size={18} strokeWidth={1.8} />
          Отправить уведомление
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {telegramChatId ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="hidden" name="studentId" value={studentId} />
            <textarea
              name="message"
              required
              value={message}
              maxLength={maxLength}
              placeholder="Введите текст сообщения..."
              className="min-h-24 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50"
              onChange={(event) => setMessage(event.target.value)}
            />
            <div className="flex items-center justify-between gap-3 text-xs">
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
              className="w-full rounded-xl"
            >
              {isPending ? "Отправка..." : "Отправить через бота"}
            </Button>
            <p className="text-[11px] leading-normal italic text-muted-foreground">
              Сообщение будет доставлено, только если ученик уже нажал `/start`
              в боте и передан корректный chat id.
            </p>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Уведомления недоступны, так как у студента не указан{" "}
              <b>Telegram chat id</b>.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Ученик должен нажать `/start` в боте и прислать свой числовой ID
              или ID чата.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
