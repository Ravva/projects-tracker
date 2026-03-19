"use client";

import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  Github01Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState, useTransition } from "react";

import { issueStudentGithubLinkAction } from "@/app/students/actions";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GithubLinkCardProps {
  studentId: string;
  githubUsername: string;
  githubUserId: string;
  telegramChatId: string;
}

export function GithubLinkCard({
  studentId,
  githubUsername,
  githubUserId,
  telegramChatId,
}: GithubLinkCardProps) {
  const [isPending, startTransition] = useTransition();
  const [loginLink, setLoginLink] = useState("");
  const [copySucceeded, setCopySucceeded] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<string | null>(null);
  const [inlineTone, setInlineTone] = useState<"success" | "error" | null>(
    null,
  );

  useEffect(() => {
    if (!copySucceeded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopySucceeded(false);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copySucceeded]);

  const hasGithubBinding = Boolean(githubUserId);
  const canIssueLink = Boolean(telegramChatId);

  const handleCopyLink = async () => {
    if (!loginLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(loginLink);
      setCopySucceeded(true);
      setInlineTone("success");
      setInlineMessage(
        "GitHub-ссылка скопирована. Отправьте её ученику и попросите войти в нужный аккаунт.",
      );
    } catch {
      setCopySucceeded(false);
      setInlineTone("error");
      setInlineMessage(
        "Браузер не дал доступ к буферу обмена. Скопируйте GitHub-ссылку вручную из карточки.",
      );
    }
  };

  const handleIssueLink = () => {
    startTransition(async () => {
      try {
        const result = await issueStudentGithubLinkAction(
          studentId,
          hasGithubBinding,
        );
        setLoginLink(result.link);
        setCopySucceeded(false);
        setInlineTone("success");
        setInlineMessage(
          hasGithubBinding
            ? `Старая GitHub-привязка для ${result.studentName} сброшена. Отправьте новую ссылку и попросите ученика войти в правильный аккаунт.`
            : `GitHub-ссылка для ${result.studentName} готова. Отправьте её ученику для привязки аккаунта.`,
        );
      } catch (error) {
        setInlineTone("error");
        setInlineMessage(
          error instanceof Error
            ? error.message
            : "Не удалось подготовить GitHub-ссылку для ученика.",
        );
      }
    });
  };

  return (
    <Card className="border-border/70 bg-card/88 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon icon={Github01Icon} size={18} strokeWidth={1.8} />
          GitHub link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 p-4">
          <div>
            <div className="font-medium">Статус привязки GitHub</div>
            <div className="mt-1 text-muted-foreground">
              {hasGithubBinding
                ? "Для карточки уже сохранен GitHub-аккаунт. Его можно сбросить и сразу перевыпустить новую ссылку."
                : "GitHub-аккаунт еще не привязан. Для выпуска ссылки ученик должен быть уже подтвержден через Telegram."}
            </div>
          </div>
          <StatusPill
            tone={hasGithubBinding ? "success" : "warning"}
            label={hasGithubBinding ? "привязан" : "не привязан"}
          />
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-muted-foreground">
          {hasGithubBinding ? (
            <>
              <div>
                GitHub username:{" "}
                {githubUsername ? `@${githubUsername}` : "не указан"}
              </div>
              <div className="mt-1 break-all">
                GitHub user id: {githubUserId}
              </div>
            </>
          ) : (
            "Активной GitHub-привязки пока нет."
          )}
        </div>

        {loginLink ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Текущая GitHub login-ссылка</div>
                <div className="mt-2 break-all rounded-xl border border-dashed border-border/70 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                  {loginLink}
                </div>
              </div>
              <button
                type="button"
                aria-label={
                  copySucceeded ? "Ссылка скопирована" : "Скопировать ссылку"
                }
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/90 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!loginLink}
                onClick={handleCopyLink}
              >
                <HugeiconsIcon
                  icon={copySucceeded ? CheckmarkCircle02Icon : Copy01Icon}
                  size={18}
                  strokeWidth={1.8}
                />
              </button>
            </div>
          </div>
        ) : null}

        <Button
          type="button"
          className="rounded-xl"
          disabled={isPending || !canIssueLink}
          onClick={handleIssueLink}
        >
          <HugeiconsIcon icon={Refresh01Icon} size={16} strokeWidth={1.8} />
          {isPending
            ? "Готовим ссылку..."
            : hasGithubBinding
              ? "Сбросить и перевыпустить ссылку"
              : "Выпустить GitHub-ссылку"}
        </Button>

        {inlineMessage ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              inlineTone === "error"
                ? "border-destructive/25 bg-destructive/8 text-destructive"
                : "border-[hsl(var(--status-success)/0.24)] bg-[hsl(var(--status-success)/0.1)] text-[hsl(var(--status-success))]"
            }`}
          >
            {inlineMessage}
          </div>
        ) : null}

        <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-muted-foreground">
          {canIssueLink
            ? "Если браузер ученика снова подставит старый GitHub-аккаунт, попросите открыть ссылку в режиме инкогнито или предварительно выйти из неверного аккаунта на github.com."
            : "Сначала нужно привязать Telegram chat id через карточку выше. Только после этого можно безопасно выпустить GitHub-ссылку для этого ученика."}
        </div>
      </CardContent>
    </Card>
  );
}
