import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { controlClass } from "./input";

/** Native <select> styled to match (Design.md §6: native is cheaper and accessible). */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select data-slot="select" className={cn(controlClass, "appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate" />
    </div>
  );
}

export { Select };
