"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  
  // Не показываем навбар на страницах авторизации
  if (pathname.startsWith("/auth/")) {
    return null;
  }
  
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg">
            Digital Projects Tracker
          </Link>
          
          {isAuthenticated && (
            <nav className="hidden md:flex gap-6">
              <Link 
                href="/dashboard" 
                className={`text-sm ${pathname === "/dashboard" ? "font-medium" : "text-muted-foreground"}`}
              >
                Дашборд
              </Link>
              <Link 
                href="/projects" 
                className={`text-sm ${pathname.startsWith("/projects") ? "font-medium" : "text-muted-foreground"}`}
              >
                Проекты
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm hidden md:inline-block">
                {session?.user?.name || session?.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Войти
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">
                  Регистрация
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}