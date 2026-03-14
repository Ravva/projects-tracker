import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentAuthRole,
  requireAuthenticatedSession,
} from "@/lib/server/auth";
import { claimStudentGithubLinkByToken } from "@/lib/server/telegram-linking";

const ERROR_COPY: Record<
  "expired" | "invalid" | "occupied" | "mismatch",
  { title: string; description: string }
> = {
  expired: {
    title: "Ссылка устарела",
    description:
      "Срок действия student-link токена уже истёк. Нажмите Telegram deep-link ещё раз и запросите новую GitHub-ссылку у бота.",
  },
  invalid: {
    title: "Ссылка недействительна",
    description:
      "Токен привязки не найден. Вернитесь в Telegram и откройте последнюю персональную ссылку от бота.",
  },
  occupied: {
    title: "GitHub уже привязан",
    description:
      "Этот GitHub-аккаунт уже закреплён за другой карточкой ученика. Нужна проверка преподавателя.",
  },
  mismatch: {
    title: "Привязка уже занята",
    description:
      "Для этой карточки уже сохранён другой `github_user_id`. Если нужна перепривязка, преподавателю нужно сначала обновить карточку ученика.",
  },
};

export default async function StudentLinkPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; preview?: string }>;
}) {
  const role = await getCurrentAuthRole();
  const sessionUser = await requireAuthenticatedSession();
  const { token, preview } = await searchParams;
  const isTeacherPreview = role === "teacher" && preview === "teacher";

  if (role === "teacher" && !isTeacherPreview) {
    redirect("/");
  }

  if (isTeacherPreview) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--status-calm)/0.12),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--status-warning)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background-secondary)))] px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">GitHub-аккаунт привязан</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-[hsl(var(--status-calm)/0.3)] bg-[hsl(var(--status-calm)/0.08)] px-4 py-3 text-foreground">
                Это teacher-only предпросмотр экрана успешной student-привязки.
              </div>
              <p>
                Карточка Превью ученика успешно связана с GitHub-аккаунтом @
                {sessionUser.githubLogin}.
              </p>
              <p>
                Перед выбором проекта подготовьте репозиторий: создайте в корне
                файл <code>AGENTS.md</code>, добавьте в него обновленную базовую
                инструкцию для ИИ и настройте <code>memory_bank</code>. Без
                этого AI-анализ и проектные сигналы будут неточными.
              </p>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 leading-6">
                <Link
                  href="https://digital-ai-news.vercel.app/posts/fb6be397-2bde-4c72-8baa-b82ecbe475d5"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Открыть инструкцию по настройке Memory Bank
                </Link>
              </div>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-[hsl(var(--status-calm)/0.24)] bg-background/80 shadow-none hover:border-[hsl(var(--status-calm)/0.4)] hover:bg-[hsl(var(--status-calm)/0.08)]"
              >
                <Link href="/my-project?preview=teacher">
                  Открыть экран выбора проекта
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const result = await claimStudentGithubLinkByToken({
    token: token ?? "",
    githubUserId: sessionUser.githubId,
    githubUsername: sessionUser.githubLogin,
  });

  if (result.ok) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--status-calm)/0.12),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--status-warning)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background-secondary)))] px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <Card className="border-border/70 bg-card/88 shadow-none">
            <CardHeader>
              <CardTitle className="text-xl">GitHub-аккаунт привязан</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                {result.alreadyLinked
                  ? `Аккаунт GitHub уже был связан с карточкой ${result.studentName}.`
                  : `Карточка ${result.studentName} успешно связана с GitHub-аккаунтом @${sessionUser.githubLogin}.`}
              </p>
              <p>
                Перед выбором проекта подготовьте репозиторий: создайте в корне
                файл <code>AGENTS.md</code>, добавьте в него обновленную базовую
                инструкцию для ИИ и настройте <code>memory_bank</code>. Без
                этого AI-анализ и проектные сигналы будут неточными.
              </p>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 leading-6">
                <Link
                  href="https://digital-ai-news.vercel.app/posts/fb6be397-2bde-4c72-8baa-b82ecbe475d5"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Открыть инструкцию по настройке Memory Bank
                </Link>
              </div>
              <Button asChild className="rounded-xl">
                <Link href="/my-project">Перейти к выбору проекта</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const copy = ERROR_COPY[result.code];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--status-calm)/0.12),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--status-warning)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background-secondary)))] px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Card className="border-border/70 bg-card/88 shadow-none">
          <CardHeader>
            <CardTitle className="text-xl">{copy.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{copy.description}</p>
            <Button
              asChild
              variant="outline"
              className="rounded-xl bg-background/90"
            >
              <Link href="/login">Вернуться ко входу</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
