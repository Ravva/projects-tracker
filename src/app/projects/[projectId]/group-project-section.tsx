"use client";

import { useOptimistic, useTransition } from "react";
import {
  addProjectMemberAction,
  removeProjectMemberAction,
  setProjectGroupModeQuickAction,
} from "@/app/projects/actions";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import type { ProjectMemberRecord, StudentRecord } from "@/lib/types";

export function GroupProjectSection({
  projectId,
  isGroupProject,
  ownerStudentName,
  members,
  availableStudents,
}: {
  projectId: string;
  isGroupProject: boolean;
  ownerStudentName: string;
  members: ProjectMemberRecord[];
  availableStudents: StudentRecord[];
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticIsGroup, setOptimisticIsGroup] = useOptimistic(
    isGroupProject,
    (_state, newValue: boolean) => newValue,
  );

  const handleToggle = () => {
    const newValue = !optimisticIsGroup;
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("isGroupProject", String(newValue));

    startTransition(async () => {
      setOptimisticIsGroup(newValue);
      await setProjectGroupModeQuickAction(formData);
    });
  };

  return (
    <>
      <div className="rounded-lg border border-border/70 bg-background/70 p-3 text-muted-foreground">
        Репозиторий закреплен за{" "}
        <span className="font-medium text-foreground">{ownerStudentName}</span>.
        Остальные подключаются как участники.
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex flex-col gap-2 rounded-lg border border-border/70 bg-background/70 p-3 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="text-sm font-medium text-foreground">
                {member.studentName}
              </div>
              <div className="text-xs text-muted-foreground">
                {member.role === "owner" ? "владелец репозитория" : "участник"}
              </div>
            </div>
            {member.role === "owner" ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground mr-1 select-none">
                    Групповой проект
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={optimisticIsGroup}
                    aria-label="Переключить режим группового проекта"
                    onClick={handleToggle}
                    disabled={isPending}
                    className={`group/switch relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200 outline-none disabled:opacity-50 ${
                      optimisticIsGroup
                        ? "bg-primary border-primary focus:ring-2 focus:ring-primary/45 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                        : "bg-neutral-200 border-neutral-300 dark:bg-white/8 dark:border-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block size-4 rounded-full shadow-sm transition-all duration-200 ${
                        optimisticIsGroup
                          ? "translate-x-5 bg-white"
                          : "translate-x-1 bg-white dark:bg-white/40"
                      }`}
                    />
                  </button>
                </div>
                <StatusPill tone="calm" label="Owner" />
              </div>
            ) : (
              <form action={removeProjectMemberAction}>
                <input type="hidden" name="projectId" value={projectId} />
                <input
                  type="hidden"
                  name="studentId"
                  value={member.studentId}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="xs"
                  className="bg-background/90"
                >
                  Удалить из проекта
                </Button>
              </form>
            )}
          </div>
        ))}
      </div>

      {optimisticIsGroup && availableStudents.length > 0 ? (
        <div className="rounded-lg border border-border/70 bg-background/70 p-3">
          <div className="mb-2 text-sm font-medium text-foreground">
            Добавить участника
          </div>
          <div className="app-scrollbar max-h-96 space-y-1.5 overflow-y-auto pr-1">
            {availableStudents.map((student) => (
              <form
                key={student.id}
                action={addProjectMemberAction}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-card/70 px-3 py-2 transition-colors hover:bg-accent/40"
              >
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="studentId" value={student.id} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {student.lastName} {student.firstName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {student.githubUsername
                      ? `GitHub: ${student.githubUsername}`
                      : "GitHub не привязан"}
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  size="xs"
                  className="shrink-0 bg-background/90"
                >
                  Добавить
                </Button>
              </form>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
