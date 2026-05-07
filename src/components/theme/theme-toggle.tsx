"use client";

import { Moon02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/**
 * Dark-mode indicator.
 * The app is dark-only — this component shows a decorative moon badge
 * without interactive theme switching.
 */
export function ThemeToggle() {
  return (
    <span
      title="Тёмная тема"
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-muted-foreground"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <HugeiconsIcon icon={Moon02Icon} size={13} strokeWidth={2} />
      <span className="hidden sm:inline">Dark</span>
    </span>
  );
}
