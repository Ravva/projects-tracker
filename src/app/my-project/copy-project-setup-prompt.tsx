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
    <div className="rounded-2xl border border-[hsl(var(--status-calm)/0.28)] bg-[hsl(var(--status-calm)/0.06)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">
            Готовый промпт для ИИ
          </div>
          <p className="text-xs leading-6 text-muted-foreground">
            Скопируйте и вставьте в ChatGPT, Cursor или другой ИИ-ассистент
            после добавления <code>AGENTS.md</code> в репозиторий.
          </p>
        </div>
        <Button
          type="button"
          variant={copied ? "outline" : "default"}
          className="shrink-0 rounded-xl"
          onClick={handleCopy}
        >
          <HugeiconsIcon
            icon={copied ? Tick02Icon : Copy01Icon}
            size={16}
            strokeWidth={1.8}
          />
          {copied ? "Скопировано" : "Скопировать промпт"}
        </Button>
      </div>
      <div className="mt-3 rounded-xl border border-border/50 bg-background/80 p-4 text-sm leading-6 text-muted-foreground">
        {projectSetupPrompt}
      </div>
    </div>
  );
}
