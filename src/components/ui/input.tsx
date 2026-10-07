import * as React from "react";

import { cn } from "@/lib/utils";

export const controlClass =
  "h-10 w-full min-w-0 rounded-control border border-line bg-surface px-3 text-base text-ink transition-colors placeholder:text-slate/80 hover:border-slate/50 focus-visible:border-lagoon disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-brick sm:text-sm";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(controlClass, className)} {...props} />;
}

export { Input };
