"use client";

import { Notification01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo, useState, useTransition } from "react";

import { sendBulkStudentNotificationAction } from "@/app/students/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type {
  BulkNotificationResult,
  BulkNotificationStudent,
} from "@/lib/types";

interface BulkNotificationCardProps {
  students: BulkNotificationStudent[];
}

interface FeedbackState {
  tone: "success" | "error";
  title: string;
  description: string;
}

function buildResultDescription(result: BulkNotificationResult) {
  const lines = [
    `Выбрано: ${result.requested}`,
    `Готовы к отправке: ${result.eligible}`,
    `Успешно отправлено: ${result.sent}`,
    `Без chat id: ${result.skippedNoChatId}`,
    `С некорректным chat id: ${result.skippedInvalidChatId}`,
  ];

  if (result.failed.length > 0) {
    lines.push("");
    lines.push("Проблемные карточки:");
    lines.push(
      ...result.failed
        .slice(0, 5)
        .map((failure) => `• ${failure.studentName}: ${failure.reason}`),
    );

    if (result.failed.length > 5) {
      lines.push(`• И ещё ${result.failed.length - 5} записей.`);
    }
  }

  return lines.join("\n");
}

export function BulkNotificationCard({ students }: BulkNotificationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const maxLength = 4096;

  const readyCount = useMemo(
    () => students.filter((student) => Boolean(student.telegramChatId)).length,
    [students],
  );

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected =
    students.length > 0 && selectedIds.length === students.length;

  const toggleStudent = (studentId: string) => {
    setSelectedIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : students.map((student) => student.id));
  };

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("message", message);

    for (const studentId of selectedIds) {
      formData.append("studentIds", studentId);
    }

    startTransition(async () => {
      try {
        const result = await sendBulkStudentNotificationAction(formData);
        setFeedback({
          tone: result.sent > 0 ? "success" : "error",
          title:
            result.sent > 0 ? "Рассылка завершена" : "Рассылка не выполнена",
          description: buildResultDescription(result),
        });

        if (result.sent > 0) {
          setMessage("");
        }
      } catch (error) {
        setFeedback({
          tone: "error",
          title: "Не удалось выполнить рассылку",
          description:
            error instanceof Error
              ? error.message
              : "Произошла ошибка при массовой отправке сообщений.",
        });
      }
    });
  };

  return (
    <>
      <Card className="border-border/70 bg-card/88 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HugeiconsIcon
              icon={Notification01Icon}
              size={18}
              strokeWidth={1.8}
            />
            Массовая Telegram-рассылка
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">Получатели</div>
              <button
                type="button"
                className="text-xs text-primary transition-opacity hover:opacity-80"
                onClick={toggleAll}
              >
                {allSelected ? "Снять выделение" : "Выбрать всех"}
              </button>
            </div>
            <p className="mt-2 leading-6 text-muted-foreground">
              Всего карточек: {students.length}. Готовы к личным уведомлениям:{" "}
              {readyCount}.
            </p>

            <div className="app-scrollbar mt-4 max-h-72 overflow-y-auto pr-1">
              <Table>
                <TableBody>
                  {students.map((student) => {
                    const isSelected = selectedSet.has(student.id);

                    return (
                      <TableRow
                        key={student.id}
                        className="cursor-pointer bg-transparent transition-colors hover:bg-accent/20"
                        onClick={() => toggleStudent(student.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            aria-label={`Выбрать ${student.lastName} ${student.firstName}`}
                            className="size-4 cursor-pointer rounded-[0.3rem] border-border bg-background align-middle accent-primary shadow-[0_1px_2px_hsl(var(--foreground)/0.08)] transition-[border-color,box-shadow,opacity] outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                            checked={isSelected}
                            style={{ accentColor: "hsl(var(--primary))" }}
                            onChange={() => toggleStudent(student.id)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {student.lastName} {student.firstName}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="font-medium">Текст рассылки</div>
            <textarea
              value={message}
              maxLength={maxLength}
              placeholder="Введите сообщение для выбранных учеников..."
              className="mt-3 min-h-28 w-full rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm outline-none ring-0 transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50"
              onChange={(event) => setMessage(event.target.value)}
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                Карточки без `chat_id` будут пропущены и попадут в итоговую
                сводку.
              </span>
              <span>
                {message.length}/{maxLength}
              </span>
            </div>
          </div>

          <Button
            type="button"
            disabled={isPending || selectedIds.length === 0 || !message.trim()}
            className="w-full rounded-xl"
            onClick={handleSubmit}
          >
            {isPending
              ? "Отправка..."
              : `Отправить выбранным (${selectedIds.length})`}
          </Button>
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
