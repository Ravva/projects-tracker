import {
  AiBrain03Icon,
  Alert01Icon,
  Calendar03Icon,
  ChartUpIcon,
  Github01Icon,
  Notification01Icon,
  Task01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { MetricBadge, MetricCard } from "@/components/app/metric-card";
import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const attendanceQueue = [
  {
    name: "Алиса Волкова",
    initials: "АВ",
    state: "Нет отметки",
    tone: "warning",
  },
  {
    name: "Егор Кузнецов",
    initials: "ЕК",
    state: "Нулевая посещаемость",
    tone: "critical",
  },
  {
    name: "Мира Соколова",
    initials: "МС",
    state: "1 из 2 занятий",
    tone: "warning",
  },
  {
    name: "Олег Титов",
    initials: "ОТ",
    state: "Норма закрыта",
    tone: "success",
  },
];

const projectRisks = [
  {
    student: "Алина Миронова",
    project: "AI Notes Assistant",
    risk: "Нет плана разработки",
    progress: "22%",
    status: "critical",
  },
  {
    student: "Роман Беляев",
    project: "Prompt Builder",
    risk: "7+ дней без коммитов",
    progress: "41%",
    status: "warning",
  },
  {
    student: "Денис Орлов",
    project: "Study Buddy Bot",
    risk: "Некорректный GitHub repo",
    progress: "0%",
    status: "critical",
  },
  {
    student: "Лия Карпова",
    project: "Course Planner",
    risk: "AI-отчет устарел",
    progress: "68%",
    status: "calm",
  },
];

const recentReports = [
  {
    title: "Study Buddy Bot",
    summary:
      "AI отмечает хороший прогресс по UI, но backend-часть почти не отражена в репозитории.",
    time: "12 минут назад",
  },
  {
    title: "Prompt Builder",
    summary:
      "План и фактическая структура начали расходиться: есть реализация фильтров, но нет user flows.",
    time: "45 минут назад",
  },
  {
    title: "AI Notes Assistant",
    summary:
      "ТЗ покрыто частично, отсутствуют признаки GitHub OAuth и storage слоя.",
    time: "2 часа назад",
  },
];

export function TeacherDashboard() {
  return (
    <TeacherShell
      eyebrow="Academic Control Room"
      title="Teacher Dashboard"
      actions={
        <>
          <Button variant="outline" className="rounded-xl bg-background/90">
            Weekly digest
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-xl">Быстрые действия</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Открыть текущую неделю</DropdownMenuItem>
              <DropdownMenuItem>Запустить GitHub sync</DropdownMenuItem>
              <DropdownMenuItem>Запустить AI-анализ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden border-border/70 bg-card/85 shadow-none">
          <CardContent className="grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <Badge
                variant="outline"
                className="border-transparent bg-[hsl(var(--status-calm)/0.14)] text-[hsl(var(--status-calm))]"
              >
                Сегодня вторник, 9 марта
              </Badge>
              <div className="space-y-2">
                <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight">
                  Один экран для посещаемости, project health и AI-контроля.
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  В фокусе текущей недели: 4 ученика без полной отметки, 3
                  проекта в зоне риска и 1 GitHub-репозиторий, требующий ручной
                  проверки.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/75 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Ближайшее занятие
                  </div>
                  <div className="mt-2 text-2xl font-semibold">
                    Четверг, 11 марта
                  </div>
                </div>
                <div className="rounded-2xl bg-[hsl(var(--status-warning)/0.16)] p-3 text-[hsl(var(--status-warning))]">
                  <HugeiconsIcon
                    icon={Calendar03Icon}
                    size={22}
                    strokeWidth={1.8}
                  />
                </div>
              </div>
              <Separator className="my-5" />
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Активных учеников
                  </span>
                  <span className="font-medium">18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Проектов в работе
                  </span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Telegram chat id заполнен
                  </span>
                  <span className="font-medium">15/18</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-base">
              Фокус недели
              <StatusPill label="3 риска" tone="warning" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Проверить отсутствующие chat id у трех учеников.",
              "Уточнить GitHub repo у проекта Study Buddy Bot.",
              "Перезапустить AI-анализ после обновления плана у AI Notes Assistant.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm leading-6"
              >
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          title="Нарушители недели"
          value="4"
          description="Ученики, которые еще не закрыли недельную норму посещаемости."
          tone="critical"
          icon={Alert01Icon}
          progress={22}
          badge={<MetricBadge label="критично" tone="critical" />}
        />
        <MetricCard
          title="Проекты в review-зоне"
          value="7"
          description="Требуют ручной проверки: stale commits, missing plan или GitHub mismatch."
          tone="warning"
          icon={Github01Icon}
          progress={46}
          badge={<MetricBadge label="внимание" tone="warning" />}
        />
        <MetricCard
          title="AI-отчеты сегодня"
          value="12"
          description="Сводки, пересчитанные с учетом ТЗ, плана и актуального дерева репозитория."
          tone="calm"
          icon={AiBrain03Icon}
          progress={74}
          badge={<MetricBadge label="в норме" tone="calm" />}
        />
        <MetricCard
          title="Посещаемость недели"
          value="81%"
          description="Средний уровень выполнения нормы по активным ученикам в текущем окне недели."
          tone="success"
          icon={ChartUpIcon}
          progress={81}
          badge={<MetricBadge label="стабильно" tone="success" />}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">
                Ученики, требующие действия
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Teacher-only список для быстрого weekly контроля.
              </p>
            </div>
            <Button variant="outline" className="rounded-xl bg-background/90">
              Открыть журнал посещаемости
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {attendanceQueue.map((student) => (
              <div
                key={student.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-secondary font-medium text-secondary-foreground">
                      {student.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {student.state}
                    </div>
                  </div>
                </div>
                <StatusPill
                  tone={
                    student.tone as "critical" | "warning" | "success" | "calm"
                  }
                  label={
                    student.tone === "critical"
                      ? "риск"
                      : student.tone === "warning"
                        ? "в работе"
                        : "норма"
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Последние AI-отчеты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentReports.map((report) => (
              <div
                key={report.title}
                className="rounded-2xl border border-border/70 bg-background/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{report.title}</div>
                  <Badge variant="outline" className="rounded-full">
                    {report.time}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {report.summary}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">
                Проекты в зоне контроля
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Риски, требующие teacher review до следующего weekly digest.
              </p>
            </div>
            <StatusPill label="4 проекта" tone="warning" />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ученик</TableHead>
                  <TableHead>Проект</TableHead>
                  <TableHead>Риск</TableHead>
                  <TableHead className="text-right">Прогресс</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectRisks.map((item) => (
                  <TableRow key={`${item.student}-${item.project}`}>
                    <TableCell className="font-medium">
                      {item.student}
                    </TableCell>
                    <TableCell>{item.project}</TableCell>
                    <TableCell>
                      <StatusPill
                        tone={
                          item.status as
                            | "critical"
                            | "warning"
                            | "success"
                            | "calm"
                        }
                        label={item.risk}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.progress}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Каналы контроля</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon
                  icon={Notification01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
                Telegram
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                Персональные уведомления и общий чат учеников.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon icon={User02Icon} size={18} strokeWidth={1.8} />
                Ученики
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                Teacher-only редактирование карточек и ручной ввод `chat_id`.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon icon={Task01Icon} size={18} strokeWidth={1.8} />
                Weekly контроль
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                Фокус на пропусках, stale repos и низком completion percent.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </TeacherShell>
  );
}
