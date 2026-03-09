import NextAuth from "next-auth";

import { authOptions } from "@/lib/server/auth";

const handler = async (
  req: Request,
  context: { params: { nextauth: string[] } },
) => {
  console.log("[NextAuth] Request URL:", req.url);
  console.log("[NextAuth] Request method:", req.method);

  const url = new URL(req.url);
  console.log("[NextAuth] Query params:", Object.fromEntries(url.searchParams));

  return NextAuth(authOptions)(req, context);
};

export { handler as GET, handler as POST };
