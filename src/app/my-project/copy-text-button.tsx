"use client";

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyTextButton({
  text,
  idleLabel,
  successLabel,
}: {
  text: string;
  idleLabel: string;
  successLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const currentLabel = copied ? successLabel : idleLabel;

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-xl bg-background/90"
      onClick={handleCopy}
      aria-label={currentLabel}
      title={currentLabel}
    >
      <HugeiconsIcon
        icon={copied ? Tick02Icon : Copy01Icon}
        size={16}
        strokeWidth={1.8}
      />
      {currentLabel}
    </Button>
  );
}
