import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  console.log("Middleware running for path:", req.nextUrl.pathname);

  // Track navigation for Tempo if enabled
  if (process.env.NEXT_PUBLIC_TEMPO) {
    // This will be captured by Tempo for analytics
    console.log("Tempo navigation:", {
      path: req.nextUrl.pathname,
      timestamp: new Date().toISOString(),
    });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("Token in middleware:", token ? "exists" : "none");

  const isAuthenticated = !!token;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

  if (isAuthenticated && isAuthPage) {
    console.log(
      "Authenticated user trying to access auth page - redirecting to dashboard",
    );
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
