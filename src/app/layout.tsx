import type { Metadata } from "next";
import { Inter, Unbounded, JetBrains_Mono } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${unbounded.variable} ${jetbrainsMono.variable} bg-background text-foreground antialiased`}
        style={{
          fontFamily: "var(--font-inter), Inter, Noto Sans, sans-serif",
        }}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
