"use client";

import { FileUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/components/ui/feedback-modal";
import { importStudentsAction } from "./actions";

interface FeedbackState {
  tone: "success" | "error";
  title: string;
  description: string;
}

export function ImportStudentsButton() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        await importStudentsAction(formData);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setFeedback({
          tone: "success",
          title: "Импорт завершён",
          description:
            "Файл обработан. Новые карточки студентов уже доступны в teacher-only списке.",
        });
      } catch (error) {
        setFeedback({
          tone: "error",
          title: "Импорт не выполнен",
          description:
            error instanceof Error
              ? error.message
              : "Произошла ошибка при импорте студентов. Проверьте формат файла.",
        });
      }
    });
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />
      <Button
        variant="outline"
        className="rounded-xl bg-background/90"
        disabled={isPending}
        onClick={() => fileInputRef.current?.click()}
      >
        <HugeiconsIcon
          icon={FileUploadIcon}
          size={16}
          strokeWidth={1.8}
          className="mr-2"
        />
        {isPending ? "Загрузка..." : "Импорт XLSX"}
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
