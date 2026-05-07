import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent whitespace-nowrap font-medium text-sm transition-all duration-200 outline-none select-none hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary/20 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:bg-primary/90 hover:shadow-[0_0_28px_rgba(6,182,212,0.5)]",
        outline:
          "bg-white/5 border border-white/10 text-foreground backdrop-blur-sm hover:bg-white/10 hover:border-primary/35 hover:shadow-[0_0_12px_rgba(6,182,212,0.12)]",
        secondary:
          "bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 hover:shadow-[0_0_16px_rgba(20,184,166,0.2)]",
        ghost:
          "bg-transparent border-transparent shadow-none text-muted-foreground hover:bg-white/8 hover:text-foreground",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/30 shadow-[0_0_16px_rgba(239,68,68,0.15)] hover:bg-destructive/25 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]",
        link: "text-primary underline-offset-4 hover:underline border-transparent shadow-none",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-7 gap-1.5 rounded-lg px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-2 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-10 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
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
