import {
  AiBrain03Icon,
  Alert01Icon,
  ArrowRight02Icon,
  Calendar03Icon,
  ChartUpIcon,
  Github01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { SendWeeklyDigestButton } from "@/components/app/send-weekly-digest-button";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getProjectProgressLabel,
  getProjectRiskLabel,
  getProjectRiskTone,
  isProjectInReviewZone,
} from "@/lib/project-risk";
import { getProjectStatusLabel, isProjectCurrent } from "@/lib/project-status";
import { parseIsoDate } from "@/lib/server/date-utils";
import { getCurrentAttendanceWeek } from "@/lib/server/repositories/attendance";
import { listProjects } from "@/lib/server/repositories/projects";
import { listStudents } from "@/lib/server/repositories/students";
import type { AttendanceLessonRecord, TeacherSessionUser } from "@/lib/types";

function getNearestLesson(lessons: AttendanceLessonRecord[]) {
  if (lessons.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    lessons.find((lesson) => parseIsoDate(lesson.lessonDate) >= today) ??
    lessons[lessons.length - 1]
  );
}

function KpiCard({
  icon,
  value,
  label,
  tone,
  href,
}: {
  icon: typeof Alert01Icon;
  value: string;
  label: string;
  tone: "critical" | "warning" | "success" | "calm";
  href?: string;
}) {
  const toneMap = {
    critical: "text-[hsl(var(--status-critical))]",
    warning: "text-[hsl(var(--status-warning))]",
    success: "text-[hsl(var(--status-success))]",
    calm: "text-[hsl(var(--status-calm))]",
  };

  const content = (
    <div className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 transition-colors hover:border-border">
      <div
        className={`rounded-xl bg-background p-2 ${toneMap[tone]} transition-transform group-hover:scale-105`}
      >
        <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-semibold leading-tight tracking-tight">
          {value}
        </div>
        <div className="truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}

export async function TeacherDashboard({
  teacher,
}: {
  teacher: TeacherSessionUser;
}) {
  const [students, projects, attendanceWeek] = await Promise.all([
    listStudents(),
    listProjects(),
    getCurrentAttendanceWeek(),
  ]);
  const attendanceLessons = attendanceWeek.lessons;
  const nearestLesson = getNearestLesson(attendanceLessons);

  const studentsNeedingAttention = students.filter(
    (student) => student.weeklyState !== "success",
  );
  const riskyProjects = projects.filter((project) =>
    isProjectInReviewZone(project),
  );
  const currentProjects = projects.filter((project) =>
    isProjectCurrent(project.status),
  );
  const averageAttendance = students.length
    ? Math.min(
        100,
        Math.round(
          students.reduce(
            (total, s) => total + Math.min(100, s.attendanceRate),
            0,
          ) / students.length,
        ),
      )
    : 0;
  const aiReportsCount = currentProjects.filter((p) => p.aiSummary).length;

  return (
    <TeacherShell
      eyebrow="Dashboard"
      title="Обзор недели"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={
        <>
          <SendWeeklyDigestButton />
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/attendance">Attendance</Link>
          </Button>
        </>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Alert01Icon}
          value={`${studentsNeedingAttention.length}`}
          label={
            studentsNeedingAttention.length
              ? `из ${students.length} учеников`
              : "все в норме"
          }
          tone={studentsNeedingAttention.length > 0 ? "critical" : "success"}
          href="/students"
        />
        <KpiCard
          icon={Github01Icon}
          value={`${riskyProjects.length}`}
          label={
            riskyProjects.length
              ? `из ${currentProjects.length} проектов`
              : "стабильно"
          }
          tone={riskyProjects.length > 0 ? "warning" : "success"}
          href="/projects"
        />
        <KpiCard
          icon={ChartUpIcon}
          value={`${averageAttendance}%`}
          label="посещаемость"
          tone={
            averageAttendance >= 75
              ? "success"
              : averageAttendance >= 25
                ? "warning"
                : "critical"
          }
          href="/attendance"
        />
        <KpiCard
          icon={AiBrain03Icon}
          value={`${aiReportsCount}/${currentProjects.length}`}
          label="AI-отчетов"
          tone="calm"
          href="/projects"
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/60 bg-card/80 shadow-none">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  size={16}
                  strokeWidth={1.8}
                  className="text-[hsl(var(--status-calm))]"
                />
                {nearestLesson?.dateLabel ?? "Нет занятий"}
              </div>
              {riskyProjects.length > 0 && (
                <StatusPill
                  label={`${riskyProjects.length} риска`}
                  tone="warning"
                />
              )}
            </div>

            {riskyProjects.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                Нет проектов в зоне контроля
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead className="h-9 px-5 text-xs">Ученик</TableHead>
                    <TableHead className="h-9 text-xs">Проект</TableHead>
                    <TableHead className="h-9 text-xs">Риск</TableHead>
                    <TableHead className="h-9 text-right text-xs">
                      Прогресс
                    </TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskyProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer border-border/40 transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="px-5 py-2.5 text-sm font-medium">
                        {project.studentName}
                      </TableCell>
                      <TableCell className="py-2.5 text-sm">
                        {project.name}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <StatusPill
                          tone={getProjectRiskTone(project)}
                          label={getProjectRiskLabel(project.risk)}
                        />
                      </TableCell>
                      <TableCell className="py-2.5 text-right text-sm font-medium">
                        {getProjectProgressLabel(project)}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Link
                          href={`/projects/${project.id}`}
                          className="flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <HugeiconsIcon icon={ArrowRight02Icon} size={14} />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {studentsNeedingAttention.length > 0 && (
            <Card className="border-border/60 bg-card/80 shadow-none">
              <CardContent className="p-0">
                <div className="border-b border-border/60 px-5 py-3 text-sm font-medium">
                  Требуют внимания
                </div>
                <div className="divide-y divide-border/40">
                  {studentsNeedingAttention.slice(0, 5).map((student) => (
                    <Link
                      key={student.id}
                      href={`/students/${student.id}`}
                      className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-muted/40"
                    >
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {student.firstName} {student.lastName}
                        </div>
                      </div>
                      <StatusPill
                        tone={student.weeklyState}
                        label={`${student.attendanceRate}%`}
                      />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {projects.filter((p) => p.aiSummary).length > 0 && (
            <Card className="border-border/60 bg-card/80 shadow-none">
              <CardContent className="p-0">
                <div className="border-b border-border/60 px-5 py-3 text-sm font-medium">
                  Последние AI-отчеты
                </div>
                <div className="divide-y divide-border/40">
                  {projects
                    .filter((p) => p.aiSummary)
                    .slice(0, 3)
                    .map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block px-5 py-2.5 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {project.name}
                          </span>
                          <StatusPill
                            tone={
                              project.status === "completed"
                                ? "success"
                                : project.status === "active"
                                  ? "calm"
                                  : "warning"
                            }
                            label={getProjectStatusLabel(project.status)}
                          />
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {project.aiSummary}
                        </p>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </TeacherShell>
  );
}
