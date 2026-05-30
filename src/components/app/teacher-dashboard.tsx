import {
  AiBrain03Icon,
  Alert01Icon,
  ArrowRight02Icon,
  Calendar03Icon,
  ChartUpIcon,
  CheckmarkCircle02Icon,
  Github01Icon,
  Notebook01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { SendWeeklyDigestButton } from "@/components/app/send-weekly-digest-button";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
import { getCurrentAttendanceLessons } from "@/lib/server/repositories/attendance";
import { listProjects } from "@/lib/server/repositories/projects";
import { listStudentsForDashboard } from "@/lib/server/repositories/students";
import type {
  AttendanceLessonRecord,
  StudentRecord,
  TeacherSessionUser,
} from "@/lib/types";

/* ─── helpers ─────────────────────────────────────────── */

function getNearestLesson(lessons: AttendanceLessonRecord[]) {
  if (lessons.length === 0) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (
    lessons.find((l) => parseIsoDate(l.lessonDate) >= today) ??
    lessons[lessons.length - 1]
  );
}

function getWeeklyAttendanceStats(
  students: StudentRecord[],
  lessons: AttendanceLessonRecord[],
) {
  const requiredMin = Math.min(2, lessons.length);
  const totalStudents = students.length;
  if (totalStudents === 0)
    return { averageRate: 0, requiredMin, totalStudents };
  const sum = students.reduce(
    (acc, s) => acc + Math.min(100, s.attendanceRate),
    0,
  );
  return {
    averageRate: Math.min(100, Math.round(sum / totalStudents)),
    requiredMin,
    totalStudents,
  };
}

/* ─── tone config ──────────────────────────────────────── */

const toneConfig = {
  critical: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    glow: "rgba(239,68,68,0.15)",
    icon: "rgba(239,68,68,0.15)",
    text: "hsl(var(--status-critical))",
  },
  warning: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    glow: "rgba(245,158,11,0.15)",
    icon: "rgba(245,158,11,0.15)",
    text: "hsl(var(--status-warning))",
  },
  success: {
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    glow: "rgba(34,197,94,0.15)",
    icon: "rgba(34,197,94,0.15)",
    text: "hsl(var(--status-success))",
  },
  calm: {
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.2)",
    glow: "rgba(6,182,212,0.15)",
    icon: "rgba(6,182,212,0.15)",
    text: "hsl(var(--status-calm))",
  },
} as const;

type Tone = keyof typeof toneConfig;

/* ─── KpiCard ──────────────────────────────────────────── */

function KpiCard({
  icon,
  title,
  value,
  label,
  sublabel,
  tone,
  href,
  progress,
}: {
  icon: typeof Alert01Icon;
  title?: string;
  value: string;
  label: string;
  sublabel?: string;
  tone: Tone;
  href?: string;
  progress?: number;
}) {
  const c = toneConfig[tone];

  const content = (
    <div
      className="group relative flex flex-col gap-3 rounded-2xl px-5 py-5 card-hover-glow"
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        backdropFilter: "blur(12px)",
        "--ambient-glow-color": c.glow,
        "--direct-glow-color": c.glow,
      } as React.CSSProperties}
    >
      {/* top accent line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px rounded-t-2xl opacity-50 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${c.border} 50%, transparent)`,
        }}
      />

      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: c.icon, border: `1px solid ${c.border}` }}
        >
          <HugeiconsIcon
            icon={icon}
            size={18}
            strokeWidth={1.8}
            style={{ color: c.text }}
          />
        </div>
        {title && (
          <div className="text-[10px] font-title font-semibold uppercase tracking-[0.14em] text-muted-foreground/90">
            {title}
          </div>
        )}
      </div>

      {/* value */}
      <div>
        <div
          className="font-title text-2xl font-bold leading-none tracking-tight sm:text-3xl"
          style={{ color: c.text }}
        >
          {value}
        </div>
        {label && (
          <div className="mt-2 text-xs text-muted-foreground">{label}</div>
        )}
        {sublabel && (
          <div className="mt-1 font-mono text-[10px] tracking-tight text-muted-foreground/60">
            {sublabel}
          </div>
        )}
      </div>

      {/* optional progress bar */}
      {typeof progress === "number" && (
        <Progress value={progress} className="h-1" />
      )}
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

/* ─── glass card shell ─────────────────────────────────── */

const glassStyle = {
  background: "rgba(26,31,43,0.72)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
} as const;

function SectionHeader({
  icon,
  label,
  pill,
}: {
  icon: typeof Calendar03Icon;
  label: string;
  pill?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/6 px-5 py-3">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        <HugeiconsIcon icon={icon} size={13} strokeWidth={2} />
        {label}
      </div>
      {pill}
    </div>
  );
}

/* ─── LessonCard ────────────────────────────────────────── */

function LessonCard({
  lesson,
  lessonsCount,
}: {
  lesson: AttendanceLessonRecord | null;
  lessonsCount: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl" style={glassStyle}>
      <SectionHeader
        icon={Calendar03Icon}
        label="Ближайшее занятие"
        pill={
          lessonsCount > 0 ? (
            <StatusPill tone="calm" label={`${lessonsCount} на неделе`} />
          ) : undefined
        }
      />
      <div className="px-5 py-4">
        {lesson ? (
          <>
            <div className="text-base font-semibold leading-snug text-foreground">
              {lesson.dateLabel}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Текущая учебная неделя
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Занятия не запланированы
          </div>
        )}
        <Link
          href="/attendance"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: "hsl(var(--status-calm))" }}
        >
          Открыть табель
          <HugeiconsIcon icon={ArrowRight02Icon} size={12} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

/* ─── main component ────────────────────────────────────── */

export async function TeacherDashboard({
  teacher,
}: {
  teacher: TeacherSessionUser;
}) {
  const [students, projects, attendanceLessons] = await Promise.all([
    listStudentsForDashboard(),
    listProjects(),
    getCurrentAttendanceLessons(),
  ]);

  const nearestLesson = getNearestLesson(attendanceLessons);
  const studentsNeedingAttention = students.filter(
    (s) => s.weeklyState !== "success",
  );
  const currentProjects = projects.filter((p) => isProjectCurrent(p.status));
  const riskyProjects = currentProjects.filter(isProjectInReviewZone);
  const { averageRate, requiredMin, totalStudents } = getWeeklyAttendanceStats(
    students,
    attendanceLessons,
  );
  const projectsWithAiReports = currentProjects.filter((p) => p.aiSummary);
  const aiReportsCount = currentProjects.filter((p) => p.aiSummary).length;

  return (
    <TeacherShell
      eyebrow="Обзор"
      title="Обзор недели"
      teacherName={teacher.name}
      teacherEmail={teacher.email}
      actions={<SendWeeklyDigestButton />}
    >
      {/* ── Row 1: KPI tiles ────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Alert01Icon}
          title="Внимание"
          tone={studentsNeedingAttention.length > 0 ? "critical" : "success"}
          value={
            studentsNeedingAttention.length > 0
              ? `${studentsNeedingAttention.length} ${studentsNeedingAttention.length === 1 ? "ученик" : "учеников"}`
              : "Все в норме"
          }
          label={
            studentsNeedingAttention.length > 0
              ? "требуют внимания"
              : "посещаемость в норме"
          }
          sublabel={
            totalStudents > 0 ? `из ${totalStudents} учеников` : undefined
          }
          href="/students"
        />
        <KpiCard
          icon={Github01Icon}
          title="Риски"
          tone={riskyProjects.length > 0 ? "warning" : "success"}
          value={
            riskyProjects.length > 0
              ? `${riskyProjects.length} ${riskyProjects.length === 1 ? "проект" : "проектов"}`
              : "Всё стабильно"
          }
          label={riskyProjects.length > 0 ? "в зоне риска" : "нет отставаний"}
          sublabel={
            currentProjects.length > 0
              ? `из ${currentProjects.length} активных`
              : undefined
          }
          href="/projects"
        />
        <KpiCard
          icon={ChartUpIcon}
          title="Посещаемость"
          tone={
            averageRate >= 75
              ? "success"
              : averageRate >= 25
                ? "warning"
                : "critical"
          }
          value={`${averageRate}%`}
          label={`средняя за неделю`}
          sublabel={`${requiredMin} ${requiredMin === 1 ? "урок" : requiredMin <= 4 ? "урока" : "уроков"} в расчёте`}
          progress={averageRate}
          href="/attendance"
        />
        <KpiCard
          icon={AiBrain03Icon}
          title="AI-покрытие"
          tone="calm"
          value={`${aiReportsCount} / ${currentProjects.length}`}
          label="проектов с AI-отчётом"
          sublabel={
            currentProjects.length > 0 &&
            aiReportsCount < currentProjects.length
              ? `${currentProjects.length - aiReportsCount} без анализа`
              : "все проанализированы"
          }
          href="/projects"
        />
      </section>

      {/* ── Row 2: Main content ──────────────────────────── */}
      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          {/* Left: риски по проектам */}
          <Card className="overflow-hidden" style={glassStyle}>
            <CardContent className="p-0">
              <SectionHeader
                icon={Github01Icon}
                label="Проекты в зоне риска"
                pill={
                  riskyProjects.length > 0 ? (
                    <StatusPill
                      tone="warning"
                      label={`${riskyProjects.length} проект${riskyProjects.length > 1 ? "а" : ""}`}
                    />
                  ) : (
                    <StatusPill tone="success" label="всё ок" />
                  )
                }
              />

              {riskyProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
                  <div
                    className="flex size-12 items-center justify-center rounded-2xl"
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={22}
                      strokeWidth={1.6}
                      style={{ color: "hsl(var(--status-success))" }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Нет проектов в зоне риска
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Все активные проекты идут в штатном режиме
                    </div>
                  </div>
                  <Link
                    href="/projects"
                    className="text-xs font-medium transition-colors"
                    style={{ color: "hsl(var(--status-calm))" }}
                  >
                    Все проекты →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="max-h-[290px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-white/5 hover:bg-transparent">
                          <TableHead className="px-5 font-semibold text-xs tracking-wider uppercase text-muted-foreground">Ученик</TableHead>
                          <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">Проект</TableHead>
                          <TableHead className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">Риск</TableHead>
                          <TableHead className="text-right font-semibold text-xs tracking-wider uppercase text-muted-foreground">Прогресс</TableHead>
                          <TableHead className="w-8" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {riskyProjects.map((project) => (
                          <TableRow key={project.id} className="cursor-pointer border-b border-white/5 hover:bg-white/[0.02]">
                            <TableCell className="px-5 font-medium">
                              {project.studentName}
                            </TableCell>
                            <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                              {project.name}
                            </TableCell>
                            <TableCell>
                              <StatusPill
                                tone={getProjectRiskTone(project)}
                                label={getProjectRiskLabel(project.risk)}
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {getProjectProgressLabel(project)}
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/projects/${project.id}`}
                                className="flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <HugeiconsIcon
                                  icon={ArrowRight02Icon}
                                  size={14}
                                  strokeWidth={2}
                                />
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-end px-5 py-3 border-t border-white/5 bg-white/[0.01]">
                    <Link
                      href="/projects"
                      className="inline-flex items-center gap-1 text-xs font-semibold tracking-wide transition-colors hover:opacity-80"
                      style={{ color: "hsl(var(--status-calm))" }}
                    >
                      Все проекты
                      <HugeiconsIcon icon={ArrowRight02Icon} size={12} strokeWidth={2} />
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Требуют внимания */}
          <div className="overflow-hidden rounded-2xl" style={glassStyle}>
            <SectionHeader
              icon={Alert01Icon}
              label="Требуют внимания"
              pill={
                studentsNeedingAttention.length > 0 ? (
                  <StatusPill
                    tone="critical"
                    label={String(studentsNeedingAttention.length)}
                  />
                ) : (
                  <StatusPill tone="success" label="норма" />
                )
              }
            />

            {studentsNeedingAttention.length === 0 ? (
              <div className="px-5 py-4 text-xs text-muted-foreground">
                Все ученики в норме на этой неделе.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {studentsNeedingAttention.slice(0, 5).map((student) => (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/4"
                  >
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback
                        className="text-xs font-semibold"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          color: "hsl(var(--status-critical))",
                        }}
                      >
                        {student.firstName[0]}
                        {student.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-foreground">
                        {student.firstName} {student.lastName}
                      </div>
                    </div>
                    <StatusPill
                      tone={student.weeklyState}
                      label={`${student.attendanceRate}%`}
                    />
                  </Link>
                ))}
                {studentsNeedingAttention.length > 5 && (
                  <div className="px-5 py-2 text-center text-xs text-muted-foreground">
                    +{studentsNeedingAttention.length - 5} ещё
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Ближайший урок */}
          <LessonCard
            lesson={nearestLesson}
            lessonsCount={attendanceLessons.length}
          />

          {/* AI-инсайты — только если есть данные */}
          {projectsWithAiReports.length > 0 && (
            <div className="overflow-hidden rounded-2xl" style={glassStyle}>
              <SectionHeader
                icon={AiBrain03Icon}
                label="AI-инсайты"
                pill={
                  <StatusPill tone="calm" label={`${aiReportsCount} отчётов`} />
                }
              />
              <div className="divide-y divide-white/5">
                {projectsWithAiReports.slice(0, 3).map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block px-5 py-3 transition-colors hover:bg-white/4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-foreground">
                        {project.name}
                      </span>
                      <StatusPill
                        tone={project.status === "active" ? "calm" : "warning"}
                        label={getProjectStatusLabel(project.status)}
                      />
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {project.aiSummary}
                    </p>
                  </Link>
                ))}
              </div>

              {projectsWithAiReports.length > 3 && (
                <>
                  <Separator />
                  <div className="px-5 py-2.5">
                    <Link
                      href="/projects"
                      className="text-xs font-medium transition-colors"
                      style={{ color: "hsl(var(--status-calm))" }}
                    >
                      Все проекты →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* AI-подсказка если ещё нет отчётов */}
          {projectsWithAiReports.length === 0 && currentProjects.length > 0 && (
            <div
              className="overflow-hidden rounded-2xl px-5 py-4"
              style={{
                background: "rgba(6,182,212,0.06)",
                border: "1px solid rgba(6,182,212,0.15)",
              }}
            >
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                <HugeiconsIcon
                  icon={Notebook01Icon}
                  size={13}
                  strokeWidth={2}
                />
                AI-анализ
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                По активным проектам ещё нет AI-отчётов. Откройте любой проект и
                запустите анализ.
              </p>
              <Link
                href="/projects"
                className="mt-2 inline-flex text-xs font-medium transition-colors"
                style={{ color: "hsl(var(--status-calm))" }}
              >
                Перейти к проектам →
              </Link>
            </div>
          )}
        </div>
      </section>
    </TeacherShell>
  );
}
