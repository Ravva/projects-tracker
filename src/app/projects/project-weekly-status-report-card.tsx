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
    <Card className="border-border/70 bg-card/88 shadow-none">
      <CardHeader>
        <div>
          <CardTitle>PDF-вид отчета по проектам</CardTitle>
          <CardDescription>
            Отдельная страница для показа родителям, печати и сохранения PDF.
          </CardDescription>
        </div>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              className="rounded-xl bg-background/90"
            >
              <Link href="/projects/report">Открыть PDF-вид</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl bg-background/90"
              onClick={handleCopy}
            >
              {copied ? "Ссылка скопирована" : "Скопировать share-ссылку"}
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          Отчет строится по текущим project signals, истории AI-отчетов и
          зарегистрированным проектам учеников. Для свежего weekly snapshot при
          необходимости сначала запустите `Sync + AI`.
        </p>
      </CardContent>
    </Card>
  );
}
