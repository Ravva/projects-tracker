import Link from "next/link";

import { PrintReportButton } from "@/app/attendance/report/print-report-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AttendanceReportData } from "@/lib/server/attendance-report";

const WEEKDAY_SHORT_LABELS: Record<string, string> = {
  Вторник: "Вт",
  Четверг: "Чт",
  Пятница: "Пт",
};

const REPORT_LEGEND_ITEMS = [
  { label: "Нет данных", state: "unmarked" },
  { label: "Отсутствовал", state: "absent" },
  { label: "Присутствовал", state: "present" },
  { label: "Не состоялось", state: "cancelled" },
] as const;

function getStateDotClassName(
  state:
    | "present"
    | "absent"
    | "unmarked"
    | "cancelled"
    | "critical"
    | "warning"
    | "success",
) {
  if (state === "cancelled") {
    return "bg-fuchsia-500 shadow-[0_0_0_1px_rgba(217,70,239,0.34)] dark:bg-fuchsia-400";
  }

  if (state === "present" || state === "success") {
    return "bg-[hsl(var(--status-success))] shadow-[0_0_0_1px_hsl(var(--status-success)/0.22)]";
  }

  if (state === "warning") {
    return "bg-[hsl(var(--status-warning))] shadow-[0_0_0_1px_hsl(var(--status-warning)/0.24)]";
  }

  if (state === "absent" || state === "critical") {
    return "bg-[hsl(var(--status-critical))] shadow-[0_0_0_1px_hsl(var(--status-critical)/0.24)]";
  }

  return "bg-background shadow-[0_0_0_1px_hsl(var(--border))]";
}

export function AttendanceReportView({
  report,
  showBackButton,
  backHref = "/attendance",
}: {
  report: AttendanceReportData;
  showBackButton: boolean;
  backHref?: string;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 print:bg-white print:px-0 print:py-0 print:text-black">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 pb-6 print:hidden">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Отчёт о посещаемости</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
            Отчёт для родителей
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-background/90"
            >
              <Link href={backHref}>К списку</Link>
            </Button>
          ) : null}
          <PrintReportButton label="Сохранить PDF" />
          <PrintReportButton label="Печать" />
          <ThemeToggle />
        </div>
      </div>

      <section className="mx-auto w-full max-w-[960px] rounded-lg border border-border/70 bg-card px-6 py-6 shadow-[0_1px_3px_rgba(16,24,40,0.1),0_1px_2px_rgba(16,24,40,0.06)] dark:shadow-none print:max-w-none print:rounded-none print:border-0 print:bg-white print:px-10 print:py-8 print:shadow-none font-sans">
        <header className="border-b border-border/60 pb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground print:text-black font-sans">
            Сводка посещаемости
          </h2>

          {/* Metadata Grid */}
          <div className="mt-5 grid grid-cols-2 gap-4 border border-border/75 bg-muted/10 dark:bg-muted/5 p-4 rounded-lg sm:grid-cols-4 print:grid-cols-4 print:bg-transparent print:border-0 print:p-0 print:gap-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold print:text-black">Неделя</span>
              <p className="text-sm font-semibold text-foreground print:text-black">{report.weekRangeLabel}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold print:text-black">Учеников</span>
              <p className="text-sm font-semibold text-foreground print:text-black">{report.studentCount}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold print:text-black">Ср. посещаемость</span>
              <p className="text-sm font-semibold text-foreground print:text-black">{report.markedStudentsCount > 0 ? `${report.averageAttendance}%` : "—"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold print:text-black">В зоне внимания</span>
              <p className="text-sm font-semibold text-foreground print:text-black">{report.studentsNeedingAttentionCount}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted-foreground print:text-black">
            <span className="font-semibold text-foreground/80 dark:text-muted-foreground mr-1">Обозначения:</span>
            {REPORT_LEGEND_ITEMS.map((item) => (
              <span key={item.label} className="inline-flex items-center gap-2">
                <span
                  className={`inline-flex size-3 rounded-full ${getStateDotClassName(item.state)}`}
                />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        </header>

        {/* Weekly Lessons Details */}
        <div className="mt-6 border-b border-border/60 pb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground print:text-black font-sans">
            Занятия недели
          </h3>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {report.lessons.map((lesson) => (
              <div
                key={`${lesson.weekdayLabel}-${lesson.dateLabel}`}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold print:text-black print:border-black/20 ${
                  lesson.isClosed
                    ? "bg-fuchsia-50/50 border-fuchsia-200/50 text-fuchsia-700 dark:bg-fuchsia-950/20 dark:border-fuchsia-900/30 dark:text-fuchsia-400 line-through"
                    : "bg-muted/40 border-border text-foreground/90"
                }`}
              >
                <span>
                  {WEEKDAY_SHORT_LABELS[lesson.weekdayLabel] ?? lesson.weekdayLabel}
                </span>
                <span className="opacity-60">•</span>
                <span>{lesson.dateLabel}</span>
                {lesson.isClosed ? (
                  <span className="ml-1 text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-800 dark:text-fuchsia-300 print:text-black">
                    Отменено
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Student Attendance List */}
        <div className="mt-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground print:text-black font-sans mb-3">
            Детализация по ученикам
          </h3>
          <div className="overflow-hidden rounded-lg border border-border/70 bg-card print:rounded-none print:border print:bg-white">
            <Table className="w-full border-collapse font-sans">
              <TableHeader className="bg-muted/15 print:bg-black/5">
                <TableRow>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground font-sans">
                    Ученик
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground font-sans text-center">
                    Вторник
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground font-sans text-center">
                    Четверг
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground font-sans text-center">
                    Пятница
                  </TableHead>
                  <TableHead className="px-4 py-3 font-semibold text-muted-foreground font-sans text-center">
                    Посещаемость
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((row) => {
                  const initials = row.studentName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);

                  return (
                    <TableRow key={row.studentName} className="hover:bg-muted/5">
                      <TableCell className="px-4 py-3.5 font-medium print:text-black">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-6.5 shrink-0 print:hidden">
                            <AvatarFallback className="bg-secondary font-bold text-[9px] text-secondary-foreground">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-foreground print:text-black">
                            {row.studentName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex size-3.5 rounded-full ${getStateDotClassName(row.tuesdayState ?? "unmarked")}`}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex size-3.5 rounded-full ${getStateDotClassName(row.thursdayState ?? "unmarked")}`}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex size-3.5 rounded-full ${getStateDotClassName(row.fridayState ?? "unmarked")}`}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`inline-flex size-3 rounded-full ${getStateDotClassName(row.weeklyStatus)}`}
                          />
                          <span className="print:text-black font-semibold text-xs text-foreground">
                            {row.attendanceRate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Attention Zone Detail cards */}
        {report.attentionItems.length > 0 ? (
          <div className="mt-8 border-t border-border/60 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground print:text-black font-sans mb-3">
              Зона внимания (потребуется связаться)
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-2">
              {report.attentionItems.map((item) => (
                <div
                  key={item.studentName}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-destructive/20 bg-destructive/5 font-semibold text-xs transition-colors hover:border-destructive/30 print:border-black/20 print:bg-transparent"
                >
                  <span className="flex items-center gap-2 text-foreground/90 print:text-black">
                    <span
                      className={`inline-flex size-2 rounded-full ${getStateDotClassName(item.tone)}`}
                    />
                    {item.studentName}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive font-bold print:text-black">
                    {item.attendanceRate}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
