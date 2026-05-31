import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Unbounded } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-unbounded",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

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

const themeInitScript = `
(() => {
  try {
    const storageKey = "projects-tracker-theme";
    const storedTheme = window.localStorage.getItem(storageKey);
    const validThemes = ["cyber-emerald", "amethyst-eclipse", "system"];
    const theme = validThemes.includes(storedTheme) ? storedTheme : "system";
    const root = document.documentElement;

    root.setAttribute(
      "data-theme",
      theme === "system" ? "cyber-emerald" : theme,
    );

    root.style.colorScheme = "dark";
  } catch {
    document.documentElement.setAttribute("data-theme", "cyber-emerald");
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${unbounded.variable} ${jetbrainsMono.variable} bg-background text-foreground antialiased`}
        style={{
          fontFamily: "var(--font-inter), Inter, Noto Sans, sans-serif",
        }}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
