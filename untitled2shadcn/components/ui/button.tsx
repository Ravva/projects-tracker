import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent whitespace-nowrap font-semibold text-sm transition-all duration-200 outline-none select-none disabled:opacity-50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 shadow-sm active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-600/10 hover:bg-primary/95 shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        outline:
          "bg-card border border-input text-foreground hover:bg-background-secondary shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        secondary:
          "bg-background-secondary text-foreground hover:bg-accent border border-border/60",
        ghost:
          "bg-transparent border-transparent shadow-none text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        destructive:
          "bg-destructive text-white border border-destructive/20 hover:bg-destructive/95",
        link: "text-primary underline-offset-4 hover:underline border-transparent shadow-none",
      },
      size: {
        default: "h-10 gap-2 px-4 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-8 gap-1.5 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-2 px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 px-5 text-sm [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-10 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-8 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 [&_svg:not([class*='size-'])]:size-4.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
