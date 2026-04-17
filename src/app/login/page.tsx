import { redirect } from "next/navigation";

import { StatusPill } from "@/components/app/status-pill";
import {
  getAuthConfigurationStatus,
  getAuthSession,
  getCurrentAuthRole,
} from "@/lib/server/auth";
import {
  buildStudentGithubCallbackPath,
  buildStudentGithubLoginPath,
} from "@/lib/server/telegram-linking";
import { LoginButton } from "./login-button";
import { StudentBindSessionCard } from "./student-bind-session-card";

function extractStudentLinkToken(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return "";
  }

  const parsedUrl = new URL(normalizedValue, "http://localhost");
  const directToken =
    parsedUrl.searchParams.get("token")?.trim() ??
    parsedUrl.searchParams.get("studentLinkToken")?.trim() ??
    "";

  if (directToken) {
    return directToken;
  }

  const nestedCallbackUrl = parsedUrl.searchParams.get("callbackUrl")?.trim();

  if (!nestedCallbackUrl || nestedCallbackUrl === normalizedValue) {
    return "";
  }

  return extractStudentLinkToken(nestedCallbackUrl);
}

function BindStepCard({
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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    studentLinkToken?: string;
  }>;
}) {
  const authConfiguration = getAuthConfigurationStatus();
  const session = await getAuthSession();
  const {
    callbackUrl: requestedCallbackUrl,
    error,
    studentLinkToken,
  } = await searchParams;
  const normalizedStudentLinkToken = studentLinkToken?.trim() ?? "";
  const fallbackCallbackUrl = normalizedStudentLinkToken
    ? buildStudentGithubCallbackPath(normalizedStudentLinkToken)
    : "/auth/complete";
  const normalizedCallbackUrl = requestedCallbackUrl?.trim() ?? "";
  const callbackStudentLinkToken = extractStudentLinkToken(
    normalizedCallbackUrl,
  );
  const effectiveStudentLinkToken =
    normalizedStudentLinkToken || callbackStudentLinkToken;
  const isStudentBindFlow = Boolean(effectiveStudentLinkToken);
  const isStudentBindContinuation = Boolean(normalizedCallbackUrl || error);
  const resolvedCallbackUrl = normalizedCallbackUrl || fallbackCallbackUrl;
  const oauthCallbackUrl = isStudentBindFlow
    ? buildStudentGithubCallbackPath(effectiveStudentLinkToken)
    : resolvedCallbackUrl;
  const studentLoginPath = effectiveStudentLinkToken
    ? buildStudentGithubLoginPath(effectiveStudentLinkToken)
    : "";

  if (session?.user) {
    if (effectiveStudentLinkToken && isStudentBindContinuation) {
      redirect(buildStudentGithubCallbackPath(effectiveStudentLinkToken));
    }

    if (!effectiveStudentLinkToken) {
      const role = await getCurrentAuthRole();

      if (role === "teacher") {
        redirect("/");
      }

      if (role === "student") {
        redirect("/my-project");
      }

      redirect("/auth/complete");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--status-calm)/0.12),transparent_28%),radial-gradient(circle_at_top_right,hsl(var(--status-warning)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--background-secondary)))] px-5 py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-border/70 bg-card/88 p-8 shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                GitHub OAuth
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                Projects Tracker
              </h1>
            </div>
            {isStudentBindFlow ? (
              <StatusPill label="Student bind flow" tone="warning" />
            ) : (
              <StatusPill label="Teacher and student login" tone="calm" />
            )}
          </div>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            {isStudentBindFlow
              ? "После входа через GitHub система свяжет ваш аккаунт с подтверждённой карточкой ученика и сразу переведет вас к выбору проекта."
              : "Teacher workspace для контроля посещаемости, ученических проектов и AI-анализа. Вход преподавателя и учеников идёт через GitHub OAuth."}
          </p>

          {isStudentBindFlow ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-[1.75rem] border border-[hsl(var(--status-warning)/0.22)] bg-[linear-gradient(135deg,hsl(var(--status-warning)/0.14),hsl(var(--background)))] px-5 py-4">
                <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[hsl(var(--status-warning))]">
                  Как это работает
                </div>
                <div className="mt-2 text-lg font-semibold leading-tight text-foreground">
                  Сначала GitHub-вход, потом автоматическая привязка к карточке
                  ученика.
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Если в браузере открыт не тот GitHub-аккаунт, ниже можно
                  сменить его до завершения привязки.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <BindStepCard
                  index="1"
                  title="Войдите через GitHub"
                  description="Откроется стандартный GitHub OAuth. Для student bind flow мы принудительно просим выбор аккаунта, чтобы снизить риск ошибочной привязки."
                />
                <BindStepCard
                  index="2"
                  title="Проверьте аккаунт и завершите привязку"
                  description="После возврата система либо сразу продолжит bind flow, либо предложит подтвердить текущий GitHub-аккаунт перед привязкой."
                />
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {authConfiguration.isConfigured ? (
              <LoginButton
                callbackUrl={oauthCallbackUrl}
                forceAccountSelection={isStudentBindFlow}
              />
            ) : (
              <span className="inline-flex cursor-not-allowed items-center rounded-xl bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
                OAuth не настроен
              </span>
            )}
          </div>

          {session?.user && isStudentBindFlow ? (
            <StudentBindSessionCard
              callbackPath={oauthCallbackUrl}
              currentGithubLogin={session.user.githubLogin ?? "unknown"}
              studentLoginPath={studentLoginPath}
            />
          ) : null}

          {error ? (
            <div className="mt-6 rounded-[1.75rem] border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
              <div className="text-[11px] font-medium uppercase tracking-[0.22em]">
                Ошибка входа
              </div>
              <p className="mt-2 leading-6">
                {isStudentBindFlow
                  ? "Связать GitHub-аккаунт не удалось. Проверьте, что открыта актуальная ссылка из Telegram, и попробуйте войти еще раз."
                  : "Доступ отклонён. Проверьте GitHub OAuth настройки и allowlist преподавателя."}
              </p>
            </div>
          ) : null}

          {isStudentBindFlow && studentLoginPath ? (
            <div className="mt-6 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              Если после GitHub-авторизации браузер снова открыл страницу входа,
              система автоматически продолжит привязку по этой student-ссылке:{" "}
              <span className="font-medium text-foreground">
                {studentLoginPath}
              </span>
              .
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
          {isStudentBindFlow ? (
            <>
              <div className="rounded-[2rem] border border-border/70 bg-card/88 p-6">
                <div className="text-sm font-medium">
                  Что произойдет после входа
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Если GitHub-аккаунт совпадает с ожидаемым сценарием, система
                  автоматически продолжит привязку и откроет страницу выбора
                  проекта.
                </p>
              </div>
              <div className="rounded-[2rem] border border-border/70 bg-card/88 p-6">
                <div className="text-sm font-medium">
                  Если открыт не тот аккаунт
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  На этой странице можно выйти и повторить вход с другим GitHub-
                  аккаунтом. Это безопаснее, чем доводить bind flow до ошибочной
                  привязки.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-[2rem] border border-border/70 bg-card/88 p-6">
                <div className="text-sm font-medium">Что защищено</div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  Преподаватель попадает в dashboard, а ученик после
                  подтверждения через Telegram получает доступ только к своему
                  маршруту выбора проекта.
                </p>
              </div>
              <div className="rounded-[2rem] border border-border/70 bg-card/88 p-6">
                <div className="text-sm font-medium">Что потребуется</div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, teacher
                  allowlist и заполненный `github_user_id` либо активная
                  student-link ссылка из Telegram.
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
