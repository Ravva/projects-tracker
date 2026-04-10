import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import GitHubProvider from "next-auth/providers/github";

import { getStudentByGithubUserId } from "@/lib/server/repositories/students";
import type {
  AuthenticatedSessionUser,
  AuthRole,
  StudentSessionUser,
  TeacherSessionUser,
} from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      githubLogin: string;
      githubId: string;
      role: AuthRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubLogin?: string;
    githubId?: string;
    githubAccessToken?: string;
    role?: AuthRole;
  }
}

function getTeacherGithubLogin() {
  return process.env.TEACHER_GITHUB_LOGIN?.trim().toLowerCase() ?? "ravva";
}

function getTeacherGithubUserId() {
  return process.env.TEACHER_GITHUB_USER_ID?.trim() ?? "";
}

function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

function isTeacherIdentity(input: { githubLogin: string; githubId: string }) {
  const teacherGithubUserId = getTeacherGithubUserId();

  if (isProductionEnvironment()) {
    return (
      Boolean(teacherGithubUserId) && input.githubId === teacherGithubUserId
    );
  }

  if (teacherGithubUserId) {
    return input.githubId === teacherGithubUserId;
  }

  return input.githubLogin === getTeacherGithubLogin();
}

function buildAuthenticatedUser(
  session: Awaited<ReturnType<typeof getAuthSession>>,
) {
  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "User",
    email: session.user.email ?? "",
    image: session.user.image ?? undefined,
    githubLogin: session.user.githubLogin ?? "",
    githubId: session.user.githubId ?? "",
  } satisfies AuthenticatedSessionUser;
}

export function getAuthConfigurationStatus() {
  const requiredKeys = ["GITHUB_ID", "GITHUB_SECRET", "NEXTAUTH_SECRET"];

  const missingKeys: string[] = requiredKeys.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });

  if (isProductionEnvironment()) {
    if (!process.env.TEACHER_GITHUB_USER_ID?.trim()) {
      missingKeys.push("TEACHER_GITHUB_USER_ID");
    }
  } else {
    const hasTeacherAllowlist =
      Boolean(process.env.TEACHER_GITHUB_USER_ID?.trim()) ||
      Boolean(process.env.TEACHER_GITHUB_LOGIN?.trim());

    if (!hasTeacherAllowlist) {
      missingKeys.push("TEACHER_GITHUB_LOGIN or TEACHER_GITHUB_USER_ID");
    }
  }

  return {
    isConfigured: missingKeys.length === 0,
    missingKeys,
  };
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user repo",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "github" || !profile) {
        return false;
      }

      const githubProfile = profile as Record<string, unknown>;
      const login = String(githubProfile.login ?? "").trim();
      const githubId = String(githubProfile.id ?? "").trim();

      return Boolean(login && githubId);
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as Record<string, unknown>;
        const githubLogin = String(githubProfile.login ?? "");
        const githubId = String(githubProfile.id ?? "");

        token.githubLogin = githubLogin;
        token.githubId = githubId;
        token.githubAccessToken = String(account.access_token ?? "");
        token.role = isTeacherIdentity({
          githubLogin: githubLogin.toLowerCase(),
          githubId,
        })
          ? "teacher"
          : "guest";
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = String(token.sub ?? "");
      session.user.githubLogin = String(token.githubLogin ?? "");
      session.user.githubId = String(token.githubId ?? "");
      session.user.role =
        token.role === "teacher" || token.role === "student"
          ? token.role
          : "guest";

      return session;
    },
  },
};

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentGithubAccessToken() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  if (!cookieHeader) {
    return "";
  }

  const token = await getToken({
    req: {
      headers: {
        cookie: cookieHeader,
      },
    } as Parameters<typeof getToken>[0]["req"],
    secret: process.env.NEXTAUTH_SECRET,
  });

  return String(token?.githubAccessToken ?? "");
}

export async function requireAuthenticatedSession(): Promise<AuthenticatedSessionUser> {
  const user = buildAuthenticatedUser(await getAuthSession());

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentAuthRole(): Promise<AuthRole> {
  const user = buildAuthenticatedUser(await getAuthSession());

  if (!user) {
    return "guest";
  }

  if (
    isTeacherIdentity({
      githubLogin: user.githubLogin.toLowerCase(),
      githubId: user.githubId,
    })
  ) {
    return "teacher";
  }

  const student = await getStudentByGithubUserId(user.githubId);

  return student ? "student" : "guest";
}

export async function requireTeacherSession(): Promise<TeacherSessionUser> {
  const user = await requireAuthenticatedSession();

  if (
    !isTeacherIdentity({
      githubLogin: user.githubLogin.toLowerCase(),
      githubId: user.githubId,
    })
  ) {
    redirect("/auth/complete");
  }

  return user;
}

export async function requireStudentSession(): Promise<StudentSessionUser> {
  const user = await requireAuthenticatedSession();
  const student = await getStudentByGithubUserId(user.githubId);

  if (!student) {
    redirect("/auth/complete");
  }

  return {
    ...user,
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
  };
}
