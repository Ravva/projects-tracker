import { getAuthConfigurationStatus } from "@/lib/server/auth";
import { buildStudentGithubLinkPath } from "@/lib/server/telegram-linking";
import { LoginButton } from "./login-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; studentLinkToken?: string }>;
}) {
  const authConfiguration = getAuthConfigurationStatus();
  const { error, studentLinkToken } = await searchParams;
  const isStudentBindFlow = Boolean(studentLinkToken?.trim());
  const callbackUrl = isStudentBindFlow
    ? buildStudentGithubLinkPath(studentLinkToken ?? "")
    : "/auth/complete";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--status-calm)/0.12),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--status-warning)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background-secondary)))] px-5 py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-border/70 bg-card/88 p-8 shadow-none">
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            GitHub OAuth
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Projects Tracker
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            {isStudentBindFlow
              ? "Student bind flow: после входа через GitHub система свяжет ваш аккаунт с подтверждённой карточкой ученика и откроет выбор проекта."
              : "Teacher workspace для контроля посещаемости, ученических проектов и AI-анализа. Вход преподавателя и учеников идёт через GitHub OAuth."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {authConfiguration.isConfigured ? (
              <LoginButton callbackUrl={callbackUrl} />
            ) : (
              <span className="inline-flex cursor-not-allowed items-center rounded-xl bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
                OAuth не настроен
              </span>
            )}
            <a
              href="/docs/README.md"
              className="inline-flex items-center rounded-xl border border-border bg-background/90 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Архитектура
            </a>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {isStudentBindFlow
                ? "Связать GitHub-аккаунт не удалось. Проверьте, что открыта актуальная ссылка из Telegram."
                : "Доступ отклонён. Проверьте GitHub OAuth настройки и allowlist преподавателя."}
            </div>
          ) : null}

          {!authConfiguration.isConfigured ? (
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              Не хватает env-переменных для входа:{" "}
              {authConfiguration.missingKeys.join(", ")}.
            </div>
          ) : null}
        </section>

        <section className="grid gap-4">
          <div className="rounded-[2rem] border border-border/70 bg-card/88 p-6">
            <div className="text-sm font-medium">Что защищено</div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Преподаватель попадает в dashboard, а ученик после подтверждения
              через Telegram получает доступ только к своему маршруту выбора
              проекта.
            </p>
          </div>
          <div className="rounded-[2rem] border border-border/70 bg-card/88 p-6">
            <div className="text-sm font-medium">Что потребуется</div>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, teacher allowlist
              и заполненный `github_user_id` либо активная student-link ссылка
              из Telegram.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
