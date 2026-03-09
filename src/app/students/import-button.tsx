"use client";

import { FileUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { importStudentsAction } from "./actions";

export function ImportStudentsButton() {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      try {
        await importStudentsAction(formData);
        // Очищаем инпут для возможности повторной загрузки того же файла
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (error) {
        console.error("Ошибка импорта:", error);
        alert(
          "Произошла ошибка при импорте студентов. Проверьте формат файла.",
        );
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
    </>
  );
}
