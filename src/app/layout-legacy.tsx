import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Projects Tracker",
  description:
    "Teacher control room for attendance, project tracking and AI reports.",
  icons: {
    icon: "/weekly-control-logo.svg",
    shortcut: "/weekly-control-logo.svg",
    apple: "/weekly-control-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
    (() => {
      try {
        const storedTheme = window.localStorage.getItem("projects-tracker-theme");
        const root = document.documentElement;
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const resolvedTheme =
          storedTheme === "light" || storedTheme === "dark" ? storedTheme : systemTheme;

        if (storedTheme === "light" || storedTheme === "dark") {
          root.setAttribute("data-theme", storedTheme);
        } else {
          root.removeAttribute("data-theme");
        }

        root.style.colorScheme = resolvedTheme;
      } catch {}
    })();
  `;

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
