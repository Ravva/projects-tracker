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
      <CardHeader>
        <div>
          <CardTitle>PDF-вид отчета</CardTitle>
          <CardDescription>
            Отдельная teacher-only страница с A4-like версткой для демонстрации
            родителям и печати через `Сохранить как PDF`.
          </CardDescription>
        </div>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="rounded-xl bg-background/90"
            >
              <Link href={`/attendance/report?weekStart=${weekStart}`}>
                Открыть PDF-вид
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl bg-background/90"
              onClick={handleCopyShareLink}
            >
              {copied ? "Ссылка скопирована" : "Скопировать share-ссылку"}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Страница рендерит аккуратный отчет с таблицей, цветными индикаторами и
          блоком `Зона внимания`. Для родителей доступна отдельная share-ссылка
          без авторизации сроком на один год. Если в журнале есть несохраненные
          изменения, сначала нажмите «Сохранить изменения».
        </p>
      </CardContent>
    </Card>
  );
}
