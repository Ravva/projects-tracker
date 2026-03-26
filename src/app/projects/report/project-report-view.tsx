import Link from "next/link";

import { PrintReportButton } from "@/app/attendance/report/print-report-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import type { ProjectReportData } from "@/lib/server/project-report";

function getStateDotClassName(
  state: "critical" | "warning" | "success" | "unmarked",
) {
  if (state === "success") {
    return "bg-[hsl(var(--status-success))] shadow-[0_0_20px_hsl(var(--status-success)/0.35)]";
  }

  if (state === "warning") {
    return "bg-[hsl(var(--status-warning))] shadow-[0_0_20px_hsl(var(--status-warning)/0.32)]";
  }

  if (state === "critical") {
    return "bg-[hsl(var(--status-critical))] shadow-[0_0_20px_hsl(var(--status-critical)/0.32)]";
  }

  return "bg-background shadow-[0_0_0_1px_hsl(var(--border))]";
}

function renderProgress(value: number | null) {
  return value === null ? "нет данных" : `${value}%`;
}

function renderDelta(value: number | null) {
  if (value === null) {
    return "нет weekly-базы";
  }

  if (value === 0) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${value}%`;
}

function renderWeeklyStatusLabel(row: ProjectReportData["rows"][number]) {
  if (!row.hasProject) {
    return "Нет данных";
  }

  if (row.weeklyStatus === "success") {
    return "Хорошая динамика";
  }

  if (row.weeklyStatus === "warning") {
    return "Нет динамики";
  }

  if (row.weeklyStatus === "critical") {
    return "Заброшен";
  }

  if (row.progressDelta === null) {
    return "Недостаточно данных";
  }

  if (row.progressDelta < 0) {
    return "Снижение прогресса";
  }

  return "Слабая динамика";
}

function renderProjectLink(input: {
  name: string;
  url: string | null;
  className?: string;
}) {
  if (!input.url) {
    return input.name;
  }

  return (
    <a
      href={input.url}
      target="_blank"
      rel="noreferrer"
      className={
        input.className ??
        "underline decoration-border underline-offset-4 print:text-black"
      }
    >
      {input.name}
    </a>
  );
}

function Section({
  items,
  title,
  emptyText,
}: {
  items: ProjectReportData["goodDynamics"];
  title: string;
  emptyText: string;
}) {
  return (
    <div className="mt-10">
      <h3 className="text-[2rem] font-semibold tracking-tight print:text-black">
        {title}
      </h3>
      <div className="mt-3 border-t border-border/70 pt-5">
        {items.length === 0 ? (
          <p className="text-xl leading-8 text-foreground/80 print:text-black">
            {emptyText}
          </p>
        ) : (
          <ul className="space-y-3 text-xl leading-8">
            {items.map((item) => (
              <li key={`${item.studentName}-${item.projectName}`}>
                <span className="font-medium print:text-black">
                  {item.studentName}
                </span>{" "}
                -{" "}
                {renderProjectLink({
                  name: item.projectName,
                  url: item.projectUrl,
                  className:
                    "underline decoration-border underline-offset-4 print:text-black",
                })}
                : {renderProgress(item.progress)} (
                {renderDelta(item.progressDelta)}; {item.updateLabel})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ProjectReportView({
  report,
  showBackButton,
}: {
  report: ProjectReportData;
  showBackButton: boolean;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 print:bg-white print:px-0 print:py-0 print:text-black">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 pb-6 print:hidden">
        <div>
          <p className="text-sm text-muted-foreground">Project report</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            PDF-вид по проектам
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <Button
              asChild
              variant="outline"
              className="rounded-xl bg-background/90"
            >
              <Link href="/projects">Назад в projects</Link>
            </Button>
          ) : null}
          <PrintReportButton label="Сохранить PDF" />
          <PrintReportButton label="Печать" />
          <ThemeToggle />
        </div>
      </div>

      <section className="mx-auto w-full max-w-[960px] rounded-[32px] border border-border/70 bg-card px-5 py-5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] print:max-w-none print:rounded-none print:border-0 print:bg-white print:px-10 print:py-8 print:shadow-none">
        <header className="border-b border-border/70 pb-5">
          <h2 className="text-[2rem] font-semibold tracking-tight print:text-black">
            Отчет по проектам
          </h2>
          <ul className="mt-4 space-y-2 text-base leading-8 text-foreground/95 print:text-black">
            <li>
              <strong>Неделя</strong>: {report.weekRangeLabel}
            </li>
            <li>
              <strong>Учеников</strong>: {report.totalStudents}
            </li>
            <li>
              <strong>Зарегистрированных проектов</strong>:{" "}
              {report.registeredProjects}
            </li>
            <li>
              <strong>Хорошая динамика</strong>: {report.goodDynamics.length}
            </li>
            <li>
              <strong>Нет динамики</strong>: {report.noDynamics.length}
            </li>
            <li>
              <strong>Заброшенные проекты</strong>: {report.abandoned.length}
            </li>
            <li>
              <strong>Нет проектов</strong>: {report.missingProjectData.length}
            </li>
          </ul>
        </header>

        <div className="mt-10">
          <h3 className="text-[2rem] font-semibold tracking-tight print:text-black">
            По ученикам
          </h3>
          <div className="mt-3 overflow-hidden rounded-[24px] border border-border/80 bg-background/30 print:rounded-none print:border print:bg-white">
            <table className="w-full border-collapse text-left text-xl">
              <thead className="bg-foreground/[0.06] text-foreground print:bg-black/5 print:text-black">
                <tr>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Фамилия Имя
                  </th>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Проект
                  </th>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Прогресс
                  </th>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Динамика
                  </th>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Последнее обновление
                  </th>
                  <th className="border-b border-border/70 px-4 py-4 font-semibold">
                    Статус недели
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="border-b border-border/60 px-4 py-4 font-medium print:text-black">
                      {row.studentName}
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 print:text-black">
                      {row.projectName
                        ? renderProjectLink({
                            name: row.projectName,
                            url: row.projectUrl,
                            className:
                              "underline decoration-border underline-offset-4 print:text-black",
                          })
                        : "данных нет"}
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 print:text-black">
                      {row.hasProject
                        ? renderProgress(row.progress)
                        : "данных нет"}
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 print:text-black">
                      {row.hasProject
                        ? renderDelta(row.progressDelta)
                        : "данных нет"}
                    </td>
                    <td className="border-b border-border/60 px-4 py-4 print:text-black">
                      {row.updateLabel}
                    </td>
                    <td className="border-b border-border/60 px-4 py-4">
                      <span className="inline-flex items-center gap-3">
                        <span
                          className={`inline-flex size-4 shrink-0 self-center rounded-full aspect-square ${getStateDotClassName(row.weeklyStatus)}`}
                        />
                        <span className="print:text-black">
                          {renderWeeklyStatusLabel(row)}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Section
          items={report.goodDynamics}
          title="Хорошая динамика"
          emptyText="Проекты с увеличением прогресса на 10% и более за неделю не обнаружены."
        />
        <Section
          items={report.noDynamics}
          title="Нет динамики"
          emptyText="Проекты без изменения процента за неделю не обнаружены."
        />
        <Section
          items={report.abandoned}
          title="Заброшенные проекты"
          emptyText="Заброшенные проекты не обнаружены."
        />

        <div className="mt-10">
          <h3 className="text-[2rem] font-semibold tracking-tight print:text-black">
            Отсутствуют данные о проекте
          </h3>
          <div className="mt-3 border-t border-border/70 pt-5">
            {report.missingProjectData.length === 0 ? (
              <p className="text-xl leading-8 text-foreground/80 print:text-black">
                Все ученики имеют зарегистрированный проект.
              </p>
            ) : (
              <ul className="space-y-3 text-xl leading-8">
                {report.missingProjectData.map((studentName) => (
                  <li key={studentName}>{studentName}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
