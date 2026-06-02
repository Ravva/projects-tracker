"use client";

import { signOut } from "next-auth/react";

import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";

interface StudentBindSessionCardProps {
  callbackPath: string;
  currentGithubLogin: string;
  studentLoginPath: string;
}

export function StudentBindSessionCard({
  callbackPath,
  currentGithubLogin,
  studentLoginPath,
}: StudentBindSessionCardProps) {
  return (
    <div className="mt-6 space-y-4 rounded-lg border border-border bg-card p-6 text-sm shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Проверка аккаунта
          </div>
          <div className="font-semibold text-foreground">
            Сейчас открыт GitHub-аккаунт @{currentGithubLogin}
          </div>
        </div>
        <StatusPill label="Нужна проверка" tone="warning" />
      </div>

      <div className="rounded-md border border-[hsl(var(--status-warning)/0.25)] bg-[hsl(var(--status-warning)/0.08)] px-4 py-3 leading-6 text-muted-foreground">
        Если это нужный аккаунт, продолжайте привязку. Если браузер держит чужую
        сессию, сначала выйдите и войдите заново: GitHub откроется с выбором
        аккаунта.
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <a href={callbackPath}>Продолжить с этим аккаунтом</a>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            signOut({
              callbackUrl: studentLoginPath,
            })
          }
        >
          Выйти и сменить аккаунт
        </Button>
      </div>

      <div className="rounded-md border border-border bg-background-secondary px-4 py-3 leading-6 text-muted-foreground">
        Если GitHub снова подставит не тот аккаунт, откройте эту же ссылку в
        режиме инкогнито или выйдите из неверного профиля на{" "}
        <code className="text-foreground">github.com</code>.
      </div>
    </div>
  );
}
