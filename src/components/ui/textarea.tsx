import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full rounded-control border border-line bg-surface p-4 text-ink transition-colors placeholder:text-slate/80 hover:border-slate/50 focus-visible:border-lagoon disabled:cursor-not-allowed aria-invalid:border-brick",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
