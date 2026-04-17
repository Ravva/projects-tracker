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
    <div className="mt-6 space-y-4 rounded-[1.75rem] border border-border/70 bg-background/70 px-5 py-5 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Проверка аккаунта
          </div>
          <div className="font-medium text-foreground">
            Сейчас открыт GitHub-аккаунт @{currentGithubLogin}
          </div>
        </div>
        <StatusPill label="Нужна проверка" tone="warning" />
      </div>

      <div className="rounded-2xl border border-[hsl(var(--status-warning)/0.22)] bg-[hsl(var(--status-warning)/0.08)] px-4 py-3 leading-6 text-muted-foreground">
        Если это нужный аккаунт, продолжайте привязку. Если браузер держит чужую
        сессию, сначала выйдите и войдите заново: GitHub откроется с выбором
        аккаунта.
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild className="rounded-xl">
          <a href={callbackPath}>Продолжить с этим аккаунтом</a>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl bg-background/90"
          onClick={() =>
            signOut({
              callbackUrl: studentLoginPath,
            })
          }
        >
          Выйти и сменить аккаунт
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-background/80 px-4 py-3 leading-6 text-muted-foreground">
        Если GitHub снова подставит не тот аккаунт, откройте эту же ссылку в
        инкогнито или выйдите из неверного профиля на `github.com`.
      </div>
    </div>
  );
}
