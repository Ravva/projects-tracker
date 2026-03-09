import {
  EditUser02Icon,
  Notification01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { StatusPill } from "@/components/app/status-pill";
import { TeacherShell } from "@/components/app/teacher-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { students } from "@/lib/mock-data";

export default function StudentsPage() {
  return (
    <TeacherShell
      eyebrow="Teacher-only module"
      title="Students"
      actions={
        <>
          <Button variant="outline" className="rounded-xl bg-background/90">
            Импорт XLSX
          </Button>
          <Button className="rounded-xl">Добавить ученика</Button>
        </>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Список учеников</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
              <Input
                placeholder="Поиск по имени, GitHub или Telegram"
                className="rounded-xl bg-background/80"
              />
              <Input
                value="Текущая неделя"
                readOnly
                className="rounded-xl bg-background/80"
              />
              <Input
                value="Teacher view"
                readOnly
                className="rounded-xl bg-background/80"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ученик</TableHead>
                  <TableHead>Telegram</TableHead>
                  <TableHead>Проекты</TableHead>
                  <TableHead>Посещаемость</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-secondary font-medium text-secondary-foreground">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            github.com/{student.githubUsername}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{student.telegramUsername}</div>
                        <div className="text-muted-foreground">
                          {student.telegramChatId || "chat id не заполнен"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.projectsCount}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <StatusPill
                          tone={student.weeklyState}
                          label={
                            student.weeklyState === "critical"
                              ? "риск"
                              : student.weeklyState === "warning"
                                ? "в работе"
                                : "норма"
                          }
                        />
                        <div className="text-sm text-muted-foreground">
                          {student.attendanceRate}% нормы
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" className="rounded-xl">
                        <Link href={`/students/${student.id}`}>
                          <HugeiconsIcon
                            icon={EditUser02Icon}
                            size={16}
                            strokeWidth={1.8}
                          />
                          Редактировать
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Сводка модуля</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon icon={User02Icon} size={18} strokeWidth={1.8} />
                Активные карточки
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                {students.length} учеников уже заведены в систему и доступны
                только преподавателю.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-3 font-medium">
                <HugeiconsIcon
                  icon={Notification01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
                Telegram readiness
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                Один ученик пока без `chat_id`, значит персональные уведомления
                не готовы.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </TeacherShell>
  );
}
