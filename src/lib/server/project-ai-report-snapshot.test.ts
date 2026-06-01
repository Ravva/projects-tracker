import { describe, expect, it } from "bun:test";
import {
  type ProjectAiInputSnapshot,
  parseProjectAiInputSnapshot,
  serializeProjectAiInputSnapshot,
} from "./project-ai-report-snapshot";

function repeat(value: string, count: number) {
  let result = "";

  for (let index = 0; index < count; index += 1) {
    result += value;
  }

  return result;
}

function buildBankBotMemoryBank() {
  return {
    projectBrief: repeat("Описание раздела проекта BankBot. ", 12_000),
    productContext: repeat("Product context BankBot, абзац текста. ", 9_000),
    activeContext: repeat(
      "Active context BankBot, запись о прогрессе. ",
      9_000,
    ),
    progress: repeat("Прогресс по BankBot, шаги итерации. ", 9_000),
    docsReadme: repeat("docs/README.md фрагмент BankBot архитектуры. ", 6_000),
  };
}

function buildCanonicalMemoryBank() {
  return {
    projectBrief: [
      "# MiniBank",
      "",
      "## Цель проекта",
      "Учебный мини-банк для тренировки UI/API и AI-анализа.",
      "",
      "## Границы MVP",
      "- локальный запуск через bun",
      "- просмотр счетов и переводов",
      "- что НЕ входит: реальная интеграция с банком",
      "",
      "## Project Deliverables",
      "| ID | Deliverable | Status | Weight |",
      "| --- | --- | --- | --- |",
      "| MB-01 | UI дашборд | in_progress | 40 |",
      "| MB-02 | API переводов | pending | 35 |",
      "| MB-03 | Импорт/экспорт | pending | 25 |",
    ].join("\n"),
    productContext: [
      "# Product Context",
      "",
      "## Проблема",
      "Ученикам нужен простой тренажер банковских сценариев без реальных денег.",
      "",
      "## Пользователь",
      "Студент, проходящий учебный модуль по API и UI.",
      "",
      "## Ценность",
      "Безопасная среда для отработки CRUD и auth.",
    ].join("\n"),
    activeContext: [
      "# Active Context",
      "",
      "## Текущий фокус",
      "- каркас UI дашборда",
      "- контракт API переводов",
      "",
      "## Активные решения",
      "- bun + Hono для backend",
      "",
      "## Блокеры",
      "- нет",
    ].join("\n"),
    progress: [
      "# Progress",
      "",
      "## Контроль изменений",
      "last_checked_commit: 2026-06-01",
      "",
      "## Changelog",
      "- 2026-06-01: добавлен MB-01 каркас дашборда",
    ].join("\n"),
    docsReadme: [
      "# MiniBank Architecture",
      "",
      "## Stack",
      "- bun + Hono",
      "- React 19",
      "- Tailwind v4",
    ].join("\n"),
  };
}

function buildInputSnapshot(
  memoryBank: ProjectAiInputSnapshot["memoryBank"],
  name = "BankBot",
): ProjectAiInputSnapshot {
  return {
    name,
    summary: "Учебный банковский бот",
    github: {
      url: "https://github.com/example/MiniBank",
      owner: "example",
      repo: name,
      branch: "main",
      lastCommit: "2026-05-30T12:00:00.000Z",
      lastCommitSha: "abc123",
      commitCount: 250,
      commitsPerWeek: 4.2,
      lastCommitDaysAgo: 1,
      isAbandoned: false,
    },
    repositorySignals: {
      hasRepository: true,
      hasMemoryBank: true,
      hasSpec: true,
      hasPlan: true,
      sourceFiles: [
        "memory_bank/projectbrief.md",
        "memory_bank/productContext.md",
        "memory_bank/activeContext.md",
        "memory_bank/progress.md",
        "docs/README.md",
      ],
    },
    taskMetrics: {
      total: 3,
      completed: 0,
      inProgress: 1,
      pending: 2,
      completionPercent: 0,
      progressCalculationStatus: "valid",
      progressCalculationDetails: "ok",
      deliverablesWeightTotal: 100,
    },
    taskHighlights: {
      completed: [],
      inProgress: ["MB-01: UI дашборд"],
      pending: ["MB-02: API переводов", "MB-03: Импорт/экспорт"],
    },
    memoryBank,
  };
}

const MEMORY_BANK_SOFT_CAPS = {
  projectBrief: 4_000,
  productContext: 1_500,
  activeContext: 1_500,
  progress: 1_500,
  docsReadme: 4_000,
} as const;

describe("project-ai-report-snapshot: canonical minimal memory bank", () => {
  it("не усекает ни одно поле при соблюдении soft caps", () => {
    const snapshot = buildInputSnapshot(buildCanonicalMemoryBank(), "MiniBank");
    const { snapshotJson, truncatedFields } =
      serializeProjectAiInputSnapshot(snapshot);
    const parsed = parseProjectAiInputSnapshot(snapshotJson);

    expect(parsed).not.toBeNull();

    if (!parsed) {
      return;
    }

    for (const key of Object.keys(
      MEMORY_BANK_SOFT_CAPS,
    ) as (keyof typeof MEMORY_BANK_SOFT_CAPS)[]) {
      expect(truncatedFields[key]).toBeUndefined();
      expect(parsed.memoryBank[key].length).toBeLessThanOrEqual(
        MEMORY_BANK_SOFT_CAPS[key],
      );
    }
  });

  it("итоговая длина snapshotJson остаётся в пределах 4× суммы soft caps", () => {
    const snapshot = buildInputSnapshot(buildCanonicalMemoryBank(), "MiniBank");
    const { snapshotJson } = serializeProjectAiInputSnapshot(snapshot);
    const capsTotal = Object.values(MEMORY_BANK_SOFT_CAPS).reduce(
      (sum, value) => sum + value,
      0,
    );

    expect(snapshotJson.length).toBeLessThan(capsTotal * 4);
  });

  it("roundtrip serialize -> parse сохраняет минимальный канон без потерь", () => {
    const snapshot = buildInputSnapshot(buildCanonicalMemoryBank(), "MiniBank");
    const { snapshotJson } = serializeProjectAiInputSnapshot(snapshot);
    const parsed = parseProjectAiInputSnapshot(snapshotJson);

    expect(parsed).not.toBeNull();

    if (!parsed) {
      return;
    }

    expect(parsed.name).toBe("MiniBank");
    expect(parsed.memoryBank.projectBrief).toBe(
      snapshot.memoryBank.projectBrief,
    );
    expect(parsed.memoryBank.productContext).toBe(
      snapshot.memoryBank.productContext,
    );
    expect(parsed.memoryBank.activeContext).toBe(
      snapshot.memoryBank.activeContext,
    );
    expect(parsed.memoryBank.progress).toBe(snapshot.memoryBank.progress);
    expect(parsed.memoryBank.docsReadme).toBe(snapshot.memoryBank.docsReadme);
  });
});

describe("project-ai-report-snapshot: regression on oversized memory bank (BankBot)", () => {
  it("усекает каждое поле memoryBank по soft caps, сохраняя ≤ cap", () => {
    const snapshot = buildInputSnapshot(buildBankBotMemoryBank());
    const { snapshotJson, truncatedFields } =
      serializeProjectAiInputSnapshot(snapshot);
    const parsed = parseProjectAiInputSnapshot(snapshotJson);

    expect(parsed).not.toBeNull();

    if (!parsed) {
      return;
    }

    for (const key of Object.keys(
      MEMORY_BANK_SOFT_CAPS,
    ) as (keyof typeof MEMORY_BANK_SOFT_CAPS)[]) {
      const cap = MEMORY_BANK_SOFT_CAPS[key];
      expect(parsed.memoryBank[key].length).toBeLessThanOrEqual(cap);
    }

    expect(truncatedFields.projectBrief).toBe(true);
    expect(truncatedFields.productContext).toBe(true);
    expect(truncatedFields.activeContext).toBe(true);
    expect(truncatedFields.progress).toBe(true);
    expect(truncatedFields.docsReadme).toBe(true);
  });

  it("обрезает по границе строки, а не посередине слова", () => {
    const memoryBank = {
      projectBrief: `${"строка 1\n".repeat(2_000)}`,
      productContext: "",
      activeContext: "",
      progress: "",
      docsReadme: "",
    };
    const snapshot = buildInputSnapshot(memoryBank);
    const { snapshotJson } = serializeProjectAiInputSnapshot(snapshot);
    const parsed = parseProjectAiInputSnapshot(snapshotJson);

    expect(parsed).not.toBeNull();

    if (!parsed) {
      return;
    }

    const head =
      parsed.memoryBank.projectBrief.split("\n\n[truncated:")[0] ?? "";

    expect(head.endsWith("строка 1")).toBe(true);
    expect(parsed.memoryBank.projectBrief).toMatch(/\[truncated: /);
    expect(parsed.memoryBank.projectBrief).toMatch(/soft cap 4000/);
  });

  it("суммарная длина snapshotJson остаётся валидной для Appwrite 49_000", () => {
    const snapshot = buildInputSnapshot(buildBankBotMemoryBank());
    const { snapshotJson } = serializeProjectAiInputSnapshot(snapshot);

    expect(snapshotJson.length).toBeLessThan(20_000);
  });
});
