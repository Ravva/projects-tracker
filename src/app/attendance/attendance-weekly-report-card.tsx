"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardHeader } from "@/components/ui/card";

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
      <CardHeader className="flex flex-wrap items-center justify-end gap-2">
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-2">
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
    </Card>
  );
}
