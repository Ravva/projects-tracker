"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { 
  DashboardIcon, 
  FileIcon, 
  BarChartIcon, 
  ExitIcon,
  HamburgerMenuIcon,
  Cross1Icon
} from "@radix-ui/react-icons";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Не показываем навбар на страницах авторизации
  if (pathname.startsWith("/auth/")) {
    return null;
  }
  
  // Получаем инициалы пользователя для аватара
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1">
              <DashboardIcon className="h-6 w-6 text-primary" />
            </div>
            <span className="hidden font-semibold sm:inline-block">Digital Projects Tracker</span>
          </Link>
          
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6 ml-6">
              <Link 
                href="/dashboard" 
                className={`text-sm flex items-center gap-1 ${pathname === "/dashboard" 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground hover:text-foreground"}`}
              >
                <DashboardIcon className="h-4 w-4" />
                <span>Дашборд</span>
              </Link>
              <Link 
                href="/projects" 
                className={`text-sm flex items-center gap-1 ${pathname.startsWith("/projects") 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground hover:text-foreground"}`}
              >
                <FileIcon className="h-4 w-4" />
                <span>Проекты</span>
              </Link>
              {session?.user?.role === "admin" && (
                <Link 
                  href="/analytics" 
                  className={`text-sm flex items-center gap-1 ${pathname.startsWith("/analytics") 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground hover:text-foreground"}`}
                >
                  <BarChartIcon className="h-4 w-4" />
                  <span>Аналитика</span>
                </Link>
              )}
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <span>{session?.user?.name || session?.user?.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/profile" className="w-full">Профиль</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                    <ExitIcon className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <Cross1Icon className="h-5 w-5" />
                ) : (
                  <HamburgerMenuIcon className="h-5 w-5" />
                )}
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:block">
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
      
      {/* Мобильное меню */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-3 space-y-1">
            <Link 
              href="/dashboard" 
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${pathname === "/dashboard" 
                ? "bg-muted font-medium" 
                : "hover:bg-muted"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <DashboardIcon className="h-4 w-4" />
              <span>Дашборд</span>
            </Link>
            <Link 
              href="/projects" 
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${pathname.startsWith("/projects") 
                ? "bg-muted font-medium" 
                : "hover:bg-muted"}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileIcon className="h-4 w-4" />
              <span>Проекты</span>
            </Link>
            {session?.user?.role === "admin" && (
              <Link 
                href="/analytics" 
                className={`flex items-center gap-2 px-3 py-2 rounded-md ${pathname.startsWith("/analytics") 
                  ? "bg-muted font-medium" 
                  : "hover:bg-muted"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChartIcon className="h-4 w-4" />
                <span>Аналитика</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}