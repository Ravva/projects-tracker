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
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm text-sm transition-all duration-200">
      <div className="mb-3 inline-flex size-7 items-center justify-center rounded-full bg-[hsl(var(--status-calm)/0.14)] font-bold text-xs text-[hsl(var(--status-calm))] uppercase tracking-wide">
        {index}
      </div>
      <div className="font-semibold text-foreground">{title}</div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
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
    <main className="flex min-h-screen items-center justify-center px-4 py-12 md:py-24">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="glass rounded-lg border border-border/80 bg-card/65 backdrop-blur-md p-8 shadow-sm transition-all duration-200">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                GitHub OAuth
              </div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                Projects Tracker
              </h1>
            </div>
            {isStudentBindFlow ? (
              <StatusPill label="Student bind flow" tone="warning" />
            ) : (
              <StatusPill label="Teacher and student login" tone="calm" />
            )}
          </div>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {isStudentBindFlow
              ? "После входа через GitHub система свяжет ваш аккаунт с подтверждённой карточкой ученика и сразу переведет вас к выбору проекта."
              : "Teacher workspace для контроля посещаемости, ученических проектов и AI-анализа. Вход преподавателя и учеников идёт через GitHub OAuth."}
          </p>

          {isStudentBindFlow ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-[hsl(var(--status-warning)/0.25)] bg-[hsl(var(--status-warning)/0.08)] px-5 py-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--status-warning))]">
                  Как это работает
                </div>
                <div className="mt-1 text-base font-bold leading-tight text-foreground">
                  Сначала GitHub-вход, потом автоматическая привязка к карточке
                  ученика.
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
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
                  title="Проверьте аккаунт"
                  description="После возврата система либо сразу продолжит bind flow, либо предложит подтвердить текущий GitHub-аккаунт перед привязкой."
                />
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            {authConfiguration.isConfigured ? (
              <div className="max-w-xs">
                <LoginButton
                  callbackUrl={oauthCallbackUrl}
                  forceAccountSelection={isStudentBindFlow}
                />
              </div>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center rounded-[8px] bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground border border-border">
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
            <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                Ошибка входа
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                {isStudentBindFlow
                  ? "Связать GitHub-аккаунт не удалось. Проверьте, что открыта актуальная ссылка из Telegram, и попробуйте войти еще раз."
                  : "Доступ отклонён. Проверьте GitHub OAuth настройки и allowlist преподавателя."}
              </p>
            </div>
          ) : null}

          {isStudentBindFlow && studentLoginPath ? (
            <div className="mt-6 rounded-lg border border-border bg-background-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              Если после GitHub-авторизации браузер снова открыл страницу входа,
              система автоматически продолжит привязку по этой student-ссылке:{" "}
              <span className="font-semibold text-foreground break-all">
                {studentLoginPath}
              </span>
              .
            </div>
          ) : null}

          {!authConfiguration.isConfigured ? (
            <div className="mt-6 rounded-lg border border-status-warning/20 bg-status-warning/10 px-4 py-3 text-xs text-status-warning font-medium">
              Не хватает env-переменных для входа:{" "}
              {authConfiguration.missingKeys.join(", ")}.
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-4">
          {isStudentBindFlow ? (
            <>
              <div className="glass rounded-lg border border-border/80 bg-card/65 backdrop-blur-md p-6 shadow-sm transition-all duration-200">
                <div className="text-sm font-semibold text-foreground">
                  Что произойдет после входа
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Если GitHub-аккаунт совпадает с ожидаемым сценарием, система
                  автоматически продолжит привязку и откроет страницу выбора
                  проекта.
                </p>
              </div>
              <div className="glass rounded-lg border border-border/80 bg-card/65 backdrop-blur-md p-6 shadow-sm transition-all duration-200">
                <div className="text-sm font-semibold text-foreground">
                  Если открыт не тот аккаунт
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  На этой странице можно выйти и повторить вход с другим GitHub-
                  аккаунтом. Это безопаснее, чем доводить bind flow до ошибочной
                  привязки.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="glass rounded-lg border border-border/80 bg-card/65 backdrop-blur-md p-6 shadow-sm transition-all duration-200">
                <div className="text-sm font-semibold text-foreground">
                  Что защищено
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Преподаватель попадает в dashboard, а ученик после
                  подтверждения через Telegram получает доступ только к своему
                  маршруту выбора проекта.
                </p>
              </div>
              <div className="glass rounded-lg border border-border/80 bg-card/65 backdrop-blur-md p-6 shadow-sm transition-all duration-200">
                <div className="text-sm font-semibold text-foreground">
                  Что потребуется
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
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
