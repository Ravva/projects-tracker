import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent whitespace-nowrap font-semibold text-sm transition-all duration-200 outline-none select-none hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary/10 hover:bg-primary/95 shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        outline:
          "bg-background/80 border border-border text-foreground hover:bg-muted/70 hover:border-border/100 backdrop-blur-xs",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-muted/65",
        ghost:
          "bg-transparent border-transparent shadow-none text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive/10 hover:bg-destructive/95",
        link: "text-primary underline-offset-4 hover:underline border-transparent shadow-none",
      },
      size: {
        default:
          "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-7.5 gap-1.5 rounded-lg px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8.5 gap-2 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4 [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-10 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-7.5 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8.5 [&_svg:not([class*='size-'])]:size-3.5",
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
