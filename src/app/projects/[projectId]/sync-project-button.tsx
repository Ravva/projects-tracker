"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function SyncProjectButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      variant="outline"
      className="rounded-xl bg-background/90"
      disabled={pending}
    >
      <span
        className={[
          "size-3 rounded-full border-2 border-current/30 border-t-current transition-opacity",
          pending ? "animate-spin opacity-100" : "opacity-0",
        ].join(" ")}
        aria-hidden="true"
      />
      {pending ? "GitHub sync выполняется" : "GitHub sync"}
    </Button>
  );
}
