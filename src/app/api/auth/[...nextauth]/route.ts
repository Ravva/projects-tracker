import { NextAuthOptions } from "next-auth";
import { NextResponse } from "next/server";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase/client";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          return null;
        }

        // Получаем дополнительные данные пользователя из таблицы users
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", data.user.id)
          .single();

        return {
          id: data.user.id,
          email: data.user.email,
          name: userData?.name || data.user.email?.split("@")[0],
          role: userData?.role || "user",
        };
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Исправляем редирект после авторизации
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } else if (url.startsWith("http")) {
        return url;
      }
      return baseUrl + "/dashboard";
    }
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };