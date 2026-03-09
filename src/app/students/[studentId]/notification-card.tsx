"use client";

import { useTransition } from "react";
import { TelegramIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { sendStudentNotificationAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationCardProps {
  studentId: string;
  telegramChatId: string;
}

export function NotificationCard({ studentId, telegramChatId }: NotificationCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await sendStudentNotificationAction(formData);
        (e.target as HTMLFormElement).reset();
        alert("Сообщение успешно отправлено!");
      } catch (error) {
        console.error("Ошибка отправки:", error);
        alert(error instanceof Error ? error.message : "Ошибка при отправке");
      }
    });
  };

  return (
    <Card className="border-border/70 bg-card/88 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
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
              placeholder="Введите текст сообщения..."
              className="min-h-24 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm outline-none ring-0 placeholder:text-muted-foreground/60 focus:border-primary/50 transition-colors"
            />
            <Button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl"
            >
              {isPending ? "Отправка..." : "Отправить через бота"}
            </Button>
            <p className="text-[11px] text-muted-foreground leading-normal italic">
              * Сообщение будет доставлено мгновенно, если ученик завел диалог с ботом.
            </p>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Уведомления недоступны, так как у студента не указан <b>Telegram chat id</b>.
            </p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Ученик должен нажать /start в боте и предоставить свой ID.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
