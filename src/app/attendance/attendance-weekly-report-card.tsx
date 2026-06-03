"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AttendanceWeeklyReportCard({
  sharePath,
  weekStart,
}: {
  sharePath: string;
  weekStart: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}${sharePath}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border/70 bg-card/88 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm font-semibold">
          Отчет для родителей
        </CardTitle>
        <CardDescription>
          Сформируйте интерактивную веб-страницу или PDF с итогами посещаемости
          за неделю.
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-background/90"
            >
              <Link href={`/attendance/report?weekStart=${weekStart}`}>
                Открыть отчёт
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-background/90"
              onClick={handleCopyShareLink}
            >
              {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
