"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

function buildProjectSetupPrompt(agentsSourceUrl: string) {
  return `Скачай и используй актуальный AGENTS.md из ${agentsSourceUrl} как единственный источник правил.
Подготовь memory_bank строго по компактному канону AGENTS.md: только четыре обязательных файла и опциональный docs/README.md, без подпапок modules/, ui_extension/, other/.

Soft caps (рекомендуемый максимум, не hard truncate):
- memory_bank/projectbrief.md — ≤ 4 000 символов, ≤ 30 строк;
- memory_bank/productContext.md — ≤ 1 500 символов, ≤ 10 строк;
- memory_bank/activeContext.md — ≤ 1 500 символов, ≤ 10 строк;
- memory_bank/progress.md — ≤ 1 500 символов, ≤ 15 строк;
- docs/README.md (опционально) — ≤ 4 000 символов, ≤ 50 строк.

Проверишь, что в memory_bank/projectbrief.md есть раздел ## Project Deliverables в виде markdown-таблицы с колонками ID | Deliverable | Status | Weight и что сумма всех Weight ровно 100.
Проверить, что каждый Status равен одному из канонических значений: pending, in_progress, completed, blocked.
Не складывай в memory_bank полные логи, дампы кода, длинные туториалы, копии ТЗ и историю коммитов — это сломает AI-анализ.
Если какой-то файл уже есть, но превышает свой soft cap — сократи его до канона: оставь только ключевые факты, удали воду и второстепенные детали.
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
    <div className="rounded-lg border border-[hsl(var(--status-calm)/0.25)] bg-[hsl(var(--status-calm)/0.06)] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">
            Готовый промпт для ИИ
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground font-medium">
            Скопируйте и вставьте в ChatGPT, Cursor или другой ИИ-ассистент
            после добавления <code>AGENTS.md</code> в репозиторий.
          </p>
        </div>
        <Button
          type="button"
          variant={copied ? "outline" : "default"}
          className="shrink-0 font-semibold"
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
      <div className="mt-3 rounded-md border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground font-medium whitespace-pre-wrap select-all">
        {projectSetupPrompt}
      </div>
    </div>
  );
}
