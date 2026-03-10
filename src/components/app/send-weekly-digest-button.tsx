"use client";

import { Notification01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState, useTransition } from "react";

import { sendTeacherWeeklyDigestAction } from "@/app/dashboard-actions";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/ui/feedback-modal";

interface FeedbackState {
  tone: "success" | "error";
  title: string;
  description: string;
}

export function SendWeeklyDigestButton() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const handleSend = () => {
    startTransition(async () => {
      try {
        const result = await sendTeacherWeeklyDigestAction();
        setFeedback({
          tone: "success",
          title: "Weekly digest отправлен",
          description: [
            `Неделя: ${result.weekRange}`,
            `Средняя посещаемость: ${result.averageAttendance}%`,
            `Ученики в зоне внимания: ${result.studentsNeedingAttention}`,
            `Проекты в зоне контроля: ${result.riskyProjects}`,
            `Доставлено в chat id: ${result.deliveredToChatId}`,
          ].join("\n"),
        });
      } catch (error) {
        setFeedback({
          tone: "error",
          title: "Не удалось отправить weekly digest",
          description:
            error instanceof Error
              ? error.message
              : "Произошла ошибка при отправке teacher digest.",
        });
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="rounded-xl bg-background/90"
        disabled={isPending}
        onClick={handleSend}
      >
        <HugeiconsIcon icon={Notification01Icon} size={16} strokeWidth={1.8} />
        {isPending ? "Отправка digest..." : "Отправить weekly digest"}
      </Button>

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
