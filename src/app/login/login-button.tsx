"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LoginButton({
  callbackUrl = "/auth/complete",
  forceAccountSelection = false,
}: {
  callbackUrl?: string;
  forceAccountSelection?: boolean;
}) {
  return (
    <Button
      type="button"
      onClick={() =>
        signIn(
          "github",
          { callbackUrl },
          forceAccountSelection ? { prompt: "select_account" } : undefined,
        )
      }
      size="lg"
      className="rounded-xl px-4 text-sm font-semibold shadow-sm shadow-primary/20"
    >
      Войти через GitHub
    </Button>
  );
}
