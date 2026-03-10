import "server-only";

import { redirect } from "next/navigation";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import type { TeacherSessionUser } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      githubLogin: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubLogin?: string;
    githubId?: string;
  }
}

function getTeacherGithubLogin() {
  return process.env.TEACHER_GITHUB_LOGIN?.trim().toLowerCase() ?? "ravva";
}

function getTeacherGithubUserId() {
  return process.env.TEACHER_GITHUB_USER_ID?.trim() ?? "";
}

export function getAuthConfigurationStatus() {
  const requiredKeys = ["GITHUB_ID", "GITHUB_SECRET", "NEXTAUTH_SECRET"];

  const missingKeys: string[] = requiredKeys.filter((key) => {
    const value = process.env[key];
    return !value || !value.trim();
  });

  const hasTeacherAllowlist =
    Boolean(process.env.TEACHER_GITHUB_USER_ID?.trim()) ||
    Boolean(process.env.TEACHER_GITHUB_LOGIN?.trim());

  if (!hasTeacherAllowlist) {
    missingKeys.push("TEACHER_GITHUB_LOGIN or TEACHER_GITHUB_USER_ID");
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
      // Принудительный flush логов
      console.log(
        "[GitHub OAuth] Full account:",
        JSON.stringify(account, null, 2),
      );
      process.stdout.write("\n");
      console.log(
        "[GitHub OAuth] Full profile:",
        JSON.stringify(profile, null, 2),
      );
      process.stdout.write("\n");

      if (account?.provider !== "github" || !profile) {
        console.log("[GitHub OAuth] Rejected: provider or profile missing");
        process.stdout.write("\n");
        return false;
      }

      const githubProfile = profile as Record<string, unknown>;
      const login = String(githubProfile.login ?? "").toLowerCase();
      const teacherGithubUserId = getTeacherGithubUserId();
      const githubId = String(githubProfile.id ?? "");
      const expectedLogin = getTeacherGithubLogin();

      // Логирование для отладки
      console.log("[GitHub OAuth] Login from GitHub:", login);
      console.log("[GitHub OAuth] Expected login:", expectedLogin);
      console.log("[GitHub OAuth] GitHub ID:", githubId);
      console.log("[GitHub OAuth] Teacher User ID:", teacherGithubUserId);

      if (teacherGithubUserId) {
        const result = githubId === teacherGithubUserId;
        console.log("[GitHub OAuth] Result (by ID):", result);
        return result;
      }

      const result = login === expectedLogin;
      console.log("[GitHub OAuth] Result (by login):", result);
      return result;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "github" && profile) {
        const githubProfile = profile as Record<string, unknown>;
        token.githubLogin = String(githubProfile.login ?? "");
        token.githubId = String(githubProfile.id ?? "");
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = String(token.sub ?? "");
      session.user.githubLogin = String(token.githubLogin ?? "");

      return session;
    },
  },
  debug: true, // Включить debug логи
};

// Логирование при инициализации
console.log("[Auth] GITHUB_ID set:", !!process.env.GITHUB_ID);
console.log("[Auth] GITHUB_SECRET set:", !!process.env.GITHUB_SECRET);
console.log("[Auth] NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
console.log("[Auth] TEACHER_GITHUB_LOGIN:", process.env.TEACHER_GITHUB_LOGIN);

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireTeacherSession(): Promise<TeacherSessionUser> {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return {
    id: session.user.id,
    name: session.user.name ?? "Teacher",
    email: session.user.email ?? "",
    image: session.user.image ?? undefined,
    githubLogin: session.user.githubLogin ?? "",
  };
}
