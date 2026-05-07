"use client";

import { Separator as SeparatorPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-white/[0.08] data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        "data-[orientation=horizontal]:bg-gradient-to-r data-[orientation=horizontal]:from-transparent data-[orientation=horizontal]:via-white/[0.12] data-[orientation=horizontal]:to-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
