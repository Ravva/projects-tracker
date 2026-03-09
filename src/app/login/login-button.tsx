"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/" })}
      className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
    >
      Войти через GitHub
    </button>
  );
}
