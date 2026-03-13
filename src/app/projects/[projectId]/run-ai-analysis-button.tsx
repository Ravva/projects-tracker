"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function RunAiAnalysisButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="rounded-xl" disabled={pending}>
      <span
        className={[
          "size-3 rounded-full border-2 border-current/30 border-t-current transition-opacity",
          pending ? "animate-spin opacity-100" : "opacity-0",
        ].join(" ")}
        aria-hidden="true"
      />
      {pending ? "AI-анализ запускается" : "Запустить AI-анализ"}
    </Button>
  );
}
