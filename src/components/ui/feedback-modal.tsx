"use client";

import { Alert02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

type FeedbackTone = "success" | "error";

interface FeedbackModalProps {
  open: boolean;
  tone: FeedbackTone;
  title: string;
  description: string;
  onClose: () => void;
  footer?: ReactNode;
}

const toneConfig = {
  success: {
    icon: CheckmarkCircle02Icon,
    iconClassName:
      "bg-[hsl(var(--status-success)/0.14)] text-[hsl(var(--status-success))]",
    borderClassName:
      "border-[hsl(var(--status-success)/0.24)] dark:border-[hsl(var(--status-success)/0.3)]",
  },
  error: {
    icon: Alert02Icon,
    iconClassName: "bg-destructive/12 text-destructive dark:bg-destructive/18",
    borderClassName: "border-destructive/20 dark:border-destructive/30",
  },
} as const;

export function FeedbackModal({
  open,
  tone,
  title,
  description,
  onClose,
  footer,
}: FeedbackModalProps) {
  if (!open) {
    return null;
  }

  const config = toneConfig[tone];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Закрыть модальное окно"
        className="absolute inset-0 bg-background/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border bg-card text-card-foreground shadow-2xl ${config.borderClassName}`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/12 via-primary/6 to-transparent" />
        <div className="relative space-y-5 p-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${config.iconClassName}`}
            >
              <HugeiconsIcon icon={config.icon} size={24} strokeWidth={1.8} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {footer ?? (
              <Button type="button" className="rounded-xl" onClick={onClose}>
                Понятно
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
