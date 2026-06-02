import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-md border px-2.5 text-xs font-medium leading-none whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-primary/8 text-primary border-primary/20 dark:bg-primary/15 dark:border-primary/30",
        secondary:
          "bg-background-secondary text-foreground border-border/80 dark:bg-muted dark:border-border",
        destructive:
          "bg-destructive/8 text-destructive border-destructive/20 dark:bg-destructive/15 dark:border-destructive/30",
        outline: "bg-transparent text-foreground border-border",
        ghost:
          "bg-transparent text-muted-foreground border-transparent hover:bg-muted/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
