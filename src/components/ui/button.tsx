import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/** Design.md §6: Primary (lagoon), Secondary (outlined), Quiet (text). Hover changes color only. */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-control text-sm font-medium whitespace-nowrap transition-colors select-none disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-lagoon text-white hover:bg-lagoon-dark active:bg-lagoon-dark",
        secondary: "border border-line bg-surface text-ink hover:border-slate/40 hover:bg-paper",
        quiet: "text-lagoon hover:bg-lagoon-tint hover:text-lagoon-dark",
        danger: "bg-brick text-white hover:bg-brick/90",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
