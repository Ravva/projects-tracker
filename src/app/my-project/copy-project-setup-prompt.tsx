"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const PROJECT_SETUP_PROMPT = `Найди файл AGENTS.md и используй его в качестве правила.
Проверь структуру Memory Bank, обнови или создай при необходимости.
После чего выполни коммит и пуш всех файлов`;

export function CopyProjectSetupPrompt() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROJECT_SETUP_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative rounded-2xl border border-border/70 bg-background/80 p-4 pr-14 text-foreground">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-3 right-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={handleCopy}
        aria-label={copied ? "Промпт скопирован" : "Скопировать промпт"}
        title={copied ? "Скопировано" : "Скопировать"}
      >
        <HugeiconsIcon
          icon={copied ? Tick02Icon : Copy01Icon}
          size={16}
          strokeWidth={1.8}
        />
      </Button>
      <pre className="whitespace-pre-wrap text-sm leading-6">
        {PROJECT_SETUP_PROMPT}
      </pre>
    </div>
  );
}
