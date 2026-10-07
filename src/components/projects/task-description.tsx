"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { PersonRef } from "@/types/user";

export interface TaskRowData {
  id: string;
  title: string;
  description?: string | null;
  deadline: string;
  estimatedHours: number;
  assignee?: PersonRef;
}

const LONG_DESCRIPTION = 110;

/** Two lines by default; longer descriptions can be expanded in place. */
export function TaskDescription({ text, className }: { text?: string | null; className?: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return <span className="text-slate">No description</span>;
  const long = text.length > LONG_DESCRIPTION;
  return (
    <div className={className}>
      <p className={cn("text-slate", !open && long && "line-clamp-2")}>{text}</p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-1 rounded-[4px] text-xs font-medium text-lagoon hover:text-lagoon-dark"
        >
          {open ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
