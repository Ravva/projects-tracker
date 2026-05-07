import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-foreground backdrop-blur-sm placeholder:text-muted-foreground transition-all duration-200 outline-none focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_3px_rgba(6,182,212,0.12)] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive/60 aria-invalid:focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
