"use client";

import { signOut } from "next-auth/react";

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
    <div className="mt-6 space-y-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-4 text-sm">
      <div className="space-y-2">
        <div className="font-medium text-foreground">
          Сейчас открыт GitHub-аккаунт @{currentGithubLogin}
        </div>
        <p className="leading-6 text-muted-foreground">
          Если это нужный аккаунт, продолжайте привязку. Если браузер держит
          чужую сессию, сначала выйдите и войдите заново: мы откроем GitHub с
          выбором аккаунта.
        </p>
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

      <p className="leading-6 text-muted-foreground">
        Если GitHub снова подставит не тот аккаунт, откройте эту же ссылку в
        инкогнито или выйдите из неверного профиля на github.com.
      </p>
    </div>
  );
}
