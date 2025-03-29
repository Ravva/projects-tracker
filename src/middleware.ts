import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");
  const isApiAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = req.nextUrl.pathname === "/" || 
                        req.nextUrl.pathname.startsWith("/about") || 
                        req.nextUrl.pathname.startsWith("/contact");
  
  // Разрешаем доступ к API аутентификации
  if (isApiAuthRoute) {
    return NextResponse.next();
  }
  
  // Если пользователь авторизован и пытается зайти на страницу авторизации,
  // перенаправляем его на дашборд
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  
  // Если пользователь не авторизован и пытается зайти на защищенную страницу,
  // перенаправляем его на страницу входа
  if (!isAuthenticated && !isAuthPage && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Исключаем статические файлы
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)",
  ],
};