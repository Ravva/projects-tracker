"use client";

import Link from "next/link";
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

export function ProjectWeeklyStatusReportCard({
  sharePath,
}: {
  sharePath: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}${sharePath}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border/70 bg-card/88 shadow-none p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            Еженедельный отчёт
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Отчёт для родителей, печати и сохранения в PDF. На основе сигналов,
            истории AI-сводок и проектов.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-background/90"
          >
            <Link href="/projects/report">Открыть отчёт</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="bg-background/90 min-w-[130px]"
            onClick={handleCopy}
          >
            {copied ? "Скопировано" : "Копировать ссылку"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
