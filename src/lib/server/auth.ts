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
      if (account?.provider !== "github" || !profile) {
        return false;
      }

      const githubProfile = profile as Record<string, unknown>;
      const login = String(githubProfile.login ?? "").toLowerCase();
      const teacherGithubUserId = getTeacherGithubUserId();
      const githubId = String(githubProfile.id ?? "");

      if (teacherGithubUserId) {
        return githubId === teacherGithubUserId;
      }

      return login === getTeacherGithubLogin();
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
};

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
