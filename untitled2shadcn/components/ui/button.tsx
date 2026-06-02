import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent whitespace-nowrap font-sans font-semibold text-sm transition-all duration-200 outline-none select-none disabled:opacity-50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:ring-4 focus-visible:ring-primary/24 focus-visible:border-primary focus-visible:outline-none shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary hover:bg-primary/90 shadow-[0_1px_2px_rgba(16,24,40,0.05),inset_0_1px_0_rgba(255,255,255,0.15)]",
        outline:
          "bg-background border border-input text-foreground hover:bg-background-secondary shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        secondary:
          "bg-background-secondary text-foreground hover:bg-muted border border-border/80 shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        ghost:
          "bg-transparent border-transparent shadow-none text-muted-foreground hover:bg-muted/45 hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        link: "text-primary underline-offset-4 hover:underline border-transparent shadow-none",
      },
      size: {
        default:
          "h-10 gap-2 rounded-[8px] px-4 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-8 gap-1.5 rounded-[6px] px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-2 rounded-[8px] px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 rounded-[8px] px-5 text-sm [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-10 rounded-[8px] [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-8 rounded-[6px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 rounded-[8px] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg":
          "size-11 rounded-[8px] [&_svg:not([class*='size-'])]:size-4.5",
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
