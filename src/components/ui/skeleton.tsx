import type * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <>
      <style>{`@keyframes shimmer { from { transform: translateX(-100%); } to { transform: translateX(200%); } }`}</style>
      <div
        data-slot="skeleton"
        className={cn(
          "relative overflow-hidden rounded-xl bg-white/[0.06]",
          "before:absolute before:inset-0 before:-translate-x-full before:content-['']",
          "before:animate-[shimmer_1.8s_ease-in-out_infinite]",
          "before:bg-gradient-to-r before:from-transparent before:via-white/[0.08] before:to-transparent",
          className,
        )}
        {...props}
      />
    </>
  );
}

export { Skeleton };
