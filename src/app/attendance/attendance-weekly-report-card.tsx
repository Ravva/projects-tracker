"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AttendanceWeeklyReportCard({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border/70 bg-card/88 shadow-none">
      <CardHeader>
        <div>
          <CardTitle>Markdown-отчет</CardTitle>
          <CardDescription>
            Готовый weekly attendance report для копирования и ручной отправки в
            Telegram.
          </CardDescription>
        </div>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl bg-background/90"
            onClick={handleCopy}
          >
            {copied ? "Скопировано" : "Скопировать отчет"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Отчет собирается из сохраненных данных недели. Если в таблице есть
          несохраненные изменения, сначала нажмите «Сохранить изменения».
        </p>
        <textarea
          readOnly
          value={markdown}
          className="min-h-80 w-full rounded-2xl border border-border/70 bg-background/80 px-4 py-3 font-mono text-xs leading-6 text-foreground outline-none"
        />
      </CardContent>
    </Card>
  );
}
