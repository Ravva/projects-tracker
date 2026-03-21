"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkTheme = resolvedTheme === "dark";
  const nextTheme = isDarkTheme ? "light" : "dark";
  const Icon = isDarkTheme ? Sun03Icon : Moon02Icon;
  const label = isDarkTheme
    ? "Переключить на светлую тему"
    : "Переключить на темную тему";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className="rounded-full bg-background/90"
      aria-label={label}
      title={label}
      onClick={() => setTheme(nextTheme)}
    >
      <HugeiconsIcon icon={Icon} strokeWidth={1.9} />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
