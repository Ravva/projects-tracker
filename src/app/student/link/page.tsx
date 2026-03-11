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
  searchParams: Promise<{ token?: string }>;
}) {
  const role = await getCurrentAuthRole();

  if (role === "teacher") {
    redirect("/");
  }

  const sessionUser = await requireAuthenticatedSession();
  const { token } = await searchParams;
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
