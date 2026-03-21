"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

function buildProjectSetupPrompt(agentsSourceUrl: string) {
  return `Скачай и используй актуальный AGENTS.md из ${agentsSourceUrl}
Проверь, что в memory_bank/projectbrief.md есть раздел ## Project Deliverables в виде markdown-таблицы с колонками ID | Deliverable | Status | Weight.
Проверь, что сумма всех Weight ровно 100.
Если memory_bank отсутствует или заполнен неверно, создай или исправь его по правилам AGENTS.md.
После исправлений обнови Memory Bank, выполни коммит и пуш всех файлов.`;
}

export function CopyProjectSetupPrompt({
  agentsSourceUrl,
}: {
  agentsSourceUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const projectSetupPrompt = buildProjectSetupPrompt(agentsSourceUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectSetupPrompt);
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
        {projectSetupPrompt}
      </pre>
    </div>
  );
}
