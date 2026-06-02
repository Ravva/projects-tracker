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
      className="w-full font-bold"
    >
      Войти через GitHub
    </Button>
  );
}
