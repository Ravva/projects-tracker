"use client";

import Link from "next/link";

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
  weekStart,
}: {
  weekStart: string;
}) {
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
          <Button
            asChild
            variant="outline"
            className="rounded-xl bg-background/90"
          >
            <Link href={`/attendance/report?weekStart=${weekStart}`}>
              Открыть PDF-вид
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Страница рендерит аккуратный отчет с таблицей, цветными индикаторами и
          блоком `Зона внимания`. Если в журнале есть несохраненные изменения,
          сначала нажмите «Сохранить изменения».
        </p>
      </CardContent>
    </Card>
  );
}
