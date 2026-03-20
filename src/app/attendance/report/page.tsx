import Link from "next/link";

import { PrintReportButton } from "@/app/attendance/report/print-report-button";
import { Button } from "@/components/ui/button";
import { buildAttendanceReportData } from "@/lib/server/attendance-report";
import { requireTeacherSession } from "@/lib/server/auth";
import { getAttendanceWeek } from "@/lib/server/repositories/attendance";

function getStateDotClassName(
  state: "present" | "absent" | "unmarked" | "critical" | "warning" | "success",
) {
  if (state === "present" || state === "success") {
    return "bg-[hsl(var(--status-success))] shadow-[0_0_20px_hsl(var(--status-success)/0.35)]";
  }

  if (state === "warning") {
    return "bg-[hsl(var(--status-warning))] shadow-[0_0_20px_hsl(var(--status-warning)/0.32)]";
  }

  if (state === "absent" || state === "critical") {
    return "bg-[hsl(var(--status-critical))] shadow-[0_0_20px_hsl(var(--status-critical)/0.32)]";
  }

  return "bg-background shadow-[0_0_0_1px_hsl(var(--border))]";
}

export default async function AttendanceReportPage({
  searchParams,
}: {
  searchParams: Promise<{ weekStart?: string }>;
}) {
  await requireTeacherSession();

  const { weekStart } = await searchParams;
  const attendanceWeek = await getAttendanceWeek(weekStart);
  const report = buildAttendanceReportData(attendanceWeek);
  const backHref = weekStart
    ? `/attendance?weekStart=${attendanceWeek.weekStart}`
    : "/attendance";

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 print:bg-white print:px-0 print:py-0 print:text-black">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 pb-6 print:hidden">
        <div>
          <p className="text-sm text-muted-foreground">Attendance report</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            PDF-вид для родителей
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="rounded-xl bg-background/90"
          >
            <Link href={backHref}>Назад в attendance</Link>
          </Button>
          <PrintReportButton />
        </div>
      </div>

      <section className="mx-auto w-full max-w-[960px] rounded-[32px] border border-border/70 bg-card px-5 py-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] print:max-w-none print:rounded-none print:border-0 print:bg-white print:px-10 print:py-8 print:shadow-none">
        <header className="border-b border-border/70 pb-5">
          <h2 className="text-[2rem] font-semibold tracking-tight print:text-black">
            Отчет по посещаемости
          </h2>
          <ul className="mt-4 space-y-2 text-base leading-8 text-foreground/95 print:text-black">
            <li>
              <strong>Неделя</strong>: {report.weekRangeLabel}
            </li>
            <li>
              <strong>Учеников</strong>: {report.studentCount}
            </li>
            <li>
              <strong>Средняя посещаемость</strong>: {report.averageAttendance}%
            </li>
            <li>
              <strong>Требуют внимания</strong>:{" "}
              {report.studentsNeedingAttentionCount}
            </li>
            <li>
              <strong>Отмечены в журнале</strong>: {report.markedStudentsCount}/
              {report.studentCount}
            </li>
          </ul>
        </header>

        <div className="mt-8">
          <h3 className="text-[2rem] font-semibold tracking-tight print:text-black">
            Занятия недели
          </h3>
          <div className="mt-3 border-t border-border/70 pt-5 text-xl leading-10 text-foreground/90 print:text-black">
            {report.lessons.map((lesson) => (
              <div key={`${lesson.weekdayLabel}-${lesson.dateLabel}`}>
                {lesson.weekdayLabel.slice(0, 2)}: {lesson.dateLabel}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-[2rem] font-semibold tracking-tight print:text-black">
            По ученикам
          </h3>
          <div className="mt-3 overflow-hidden rounded-[24px] border border-border/80 bg-background/30 print:rounded-none print:border print:bg-white">
            <table className="w-full border-collapse text-left text-xl">
              <thead className="bg-foreground/[0.06] text-foreground print:bg-black/5 print:text-black">
                <tr>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Ученик
                  </th>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Вторник
                  </th>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Четверг
                  </th>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Пятница
                  </th>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Статус недели
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.studentName}>
                    <td className="border-b border-border/60 px-4 py-4 font-medium print:text-black">
                      {row.studentName}
                    </td>
                    <td className="border-b border-border/60 px-4 py-4">
                      <span
                        className={`inline-flex size-4 rounded-full ${getStateDotClassName(row.tuesdayState ?? "unmarked")}`}
                      />
                    </td>
                    <td className="border-b border-border/60 px-4 py-4">
                      <span
                        className={`inline-flex size-4 rounded-full ${getStateDotClassName(row.thursdayState ?? "unmarked")}`}
                      />
                    </td>
                    <td className="border-b border-border/60 px-4 py-4">
                      <span
                        className={`inline-flex size-4 rounded-full ${getStateDotClassName(row.fridayState ?? "unmarked")}`}
                      />
                    </td>
                    <td className="border-b border-border/60 px-4 py-4">
                      <span className="inline-flex items-center gap-3">
                        <span
                          className={`inline-flex size-4 rounded-full ${getStateDotClassName(row.weeklyStatus)}`}
                        />
                        <span className="print:text-black">
                          {row.attendanceRate}%
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {report.attentionItems.length > 0 ? (
          <div className="mt-10">
            <h3 className="text-[2rem] font-semibold tracking-tight print:text-black">
              Зона внимания
            </h3>
            <div className="mt-3 border-t border-border/70 pt-5">
              <ul className="space-y-3 text-xl leading-8">
                {report.attentionItems.map((item) => (
                  <li
                    key={item.studentName}
                    className="flex items-center gap-3"
                  >
                    <span
                      className={`inline-flex size-4 rounded-full ${getStateDotClassName(item.tone)}`}
                    />
                    <span className="print:text-black">
                      {item.studentName} - {item.attendanceRate}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
