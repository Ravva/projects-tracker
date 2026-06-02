"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

interface RepoSubmitButtonProps {
  label: string;
  disabled: boolean;
}

export function RepoSubmitButton({ label, disabled }: RepoSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <Button
      type="submit"
      className="min-w-[9rem]"
      disabled={isDisabled}
      aria-busy={pending}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg
            className="size-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Привязка…
        </span>
      ) : (
        label
      )}
    </Button>
  );
}
