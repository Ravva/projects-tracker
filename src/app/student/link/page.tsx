import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentAuthRole,
  requireAuthenticatedSession,
} from "@/lib/server/auth";
import { claimStudentGithubLinkByToken } from "@/lib/server/telegram-linking";

const ERROR_COPY: Record<
  "expired" | "invalid" | "occupied" | "mismatch",
  {
    title: string;
    description: string;
    nextStep: string;
    tone: "critical" | "warning";
  }
> = {
  expired: {
    title: "Ссылка устарела",
    description:
      "Срок действия student-link токена уже истёк. Нажмите Telegram deep-link ещё раз и запросите новую GitHub-ссылку у бота.",
    nextStep:
      "Вернитесь в Telegram, откройте последнюю ссылку от бота или попросите преподавателя выпустить новую GitHub-ссылку.",
    tone: "warning",
  },
  invalid: {
    title: "Ссылка недействительна",
    description:
      "Токен привязки не найден. Вернитесь в Telegram и откройте последнюю персональную ссылку от бота.",
    nextStep:
      "Откройте актуальную персональную ссылку из Telegram. Если она потерялась, преподаватель может перевыпустить новую.",
    tone: "warning",
  },
  occupied: {
    title: "GitHub уже привязан",
    description:
      "Этот GitHub-аккаунт уже закреплён за другой карточкой ученика. Нужна проверка преподавателя.",
    nextStep:
      "Проверьте, что вы вошли под правильным GitHub-аккаунтом. Если аккаунт верный, преподавателю нужно вручную проверить привязку.",
    tone: "critical",
  },
  mismatch: {
    title: "Привязка уже занята",
    description:
      "Для этой карточки уже сохранён другой `github_user_id`. Если нужна перепривязка, преподавателю нужно сначала обновить карточку ученика.",
    nextStep:
      "Сообщите преподавателю, что нужна перепривязка GitHub-аккаунта. После сброса он сможет выдать новую student-ссылку.",
    tone: "critical",
  },
};

function StepCard({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/72 p-4">
      <div className="mb-3 inline-flex size-8 items-center justify-center rounded-full bg-[hsl(var(--status-calm)/0.14)] font-semibold text-[hsl(var(--status-calm))]">
        {index}
      </div>
      <div className="font-medium text-foreground">{title}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function SuccessStateCard({
  studentName,
  githubLogin,
  alreadyLinked,
  preview = false,
}: {
  studentName: string;
  githubLogin: string;
  alreadyLinked: boolean;
  preview?: boolean;
}) {
  return (
    <Card className="border-border/70 bg-card/88 shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <StatusPill
              label={alreadyLinked ? "Уже было связано" : "Привязка завершена"}
              tone="success"
            />
            <CardTitle className="text-xl">GitHub-аккаунт привязан</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-sm text-muted-foreground">
        {preview ? (
          <div className="rounded-2xl border border-[hsl(var(--status-calm)/0.3)] bg-[hsl(var(--status-calm)/0.08)] px-4 py-3 text-foreground">
            Это teacher-only предпросмотр экрана успешной student-привязки.
          </div>
        ) : null}
        <div className="rounded-[1.75rem] border border-[hsl(var(--status-success)/0.28)] bg-[linear-gradient(135deg,hsl(var(--status-success)/0.16),hsl(var(--status-calm)/0.08)_58%,hsl(var(--background)))] px-5 py-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--status-success))]">
            Что произошло
          </div>
          <div className="mt-2 text-lg font-semibold leading-tight text-foreground">
            {alreadyLinked
              ? `Аккаунт @${githubLogin} уже был привязан к карточке ${studentName}.`
              : `Карточка ${studentName} успешно связана с GitHub-аккаунтом @${githubLogin}.`}
          </div>
          <p className="mt-2 leading-6">
            Следующий шаг теперь понятный: откроется student-экран выбора
            проекта, где система сама подскажет, можно ли выбрать новый
            репозиторий и что нужно подготовить перед AI-анализом.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Что дальше
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <StepCard
              index="1"
              title="Откройте выбор проекта"
              description="На следующем экране появится список ваших GitHub-репозиториев и понятные статусы: что можно выбрать сразу, а что пока недоступно."
            />
            <StepCard
              index="2"
              title="Подготовьте репозиторий"
              description="На странице `/my-project` уже есть готовые инструкции: как скопировать `AGENTS.md`, как подготовить `memory_bank` и как запустить ИИ без лишних ручных шагов."
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-xl">
            <Link
              href={preview ? "/my-project?preview=teacher" : "/my-project"}
            >
              Перейти к выбору проекта
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-xl bg-background/90"
          >
            <Link href="/login">Вернуться ко входу</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
          <SuccessStateCard
            studentName="Превью ученика"
            githubLogin={sessionUser.githubLogin}
            alreadyLinked={false}
            preview
          />
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
          <SuccessStateCard
            studentName={result.studentName}
            githubLogin={sessionUser.githubLogin}
            alreadyLinked={result.alreadyLinked}
          />
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
            <div className="space-y-3">
              <StatusPill label={copy.title} tone={copy.tone} />
              <CardTitle className="text-xl">{copy.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-[1.75rem] border border-[hsl(var(--status-warning)/0.22)] bg-[linear-gradient(135deg,hsl(var(--status-warning)/0.14),hsl(var(--background)))] px-5 py-4">
              <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--status-warning))]">
                Что произошло
              </div>
              <p className="mt-2 leading-6">{copy.description}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="text-sm font-medium text-foreground">
                Что делать сейчас
              </div>
              <p className="mt-2 leading-6 text-muted-foreground">
                {copy.nextStep}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-xl">
                <Link href="/login">Попробовать снова</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl bg-background/90"
              >
                <Link href="/">На главную</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
