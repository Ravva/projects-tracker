"use client";

import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group/switch peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border border-white/10 bg-white/8 outline-none transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "data-[state=checked]:border-primary/40 data-[state=checked]:bg-primary/25",
        "data-[state=checked]:shadow-[0_0_12px_rgba(6,182,212,0.3)]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full shadow-sm transition-all duration-200",
          "translate-x-1 bg-white/40",
          "data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary",
          "data-[state=checked]:shadow-[0_0_6px_rgba(6,182,212,0.6)]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
