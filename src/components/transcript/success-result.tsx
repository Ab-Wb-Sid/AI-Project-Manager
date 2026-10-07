"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProjectDot } from "@/components/shared/project-dot";
import { getProjects } from "@/lib/api";
import { formatCount, formatHours } from "@/lib/format";
import { buildHueMap, colorFor } from "@/lib/project-hues";
import { useApi } from "@/lib/use-api";
import type { TranscriptSuccess } from "@/types/transcript";

/** The payoff: what was decided, now saved. Fades in once (150ms); no other motion. */
export function SuccessResult({ result }: { result: TranscriptSuccess }) {
  const { projectCount, taskCount, projects } = result.created;
  const ids = projects.map((p) => p.id).join(",");
  // Re-read the saved projects for their colors and hour totals (only what the server returns).
  const saved = useApi(`saved:${ids}`, getProjects);
  const { hues, hoursById } = useMemo(() => {
    const list = saved.data ?? [];
    return {
      hues: buildHueMap(list.length ? list : projects),
      hoursById: new Map(list.map((p) => [p.id, p.totalHours])),
    };
  }, [saved.data, projects]);

  return (
    <div className="flex flex-1 animate-fade-once flex-col motion-reduce:animate-none">
      <div role="status" className="flex items-start gap-3 text-fern">
        <Check aria-hidden className="mt-1.5 size-7 shrink-0" strokeWidth={2.5} />
        <p className="text-2xl font-semibold tracking-[-0.015em]">
          {formatCount(projectCount, "project")} and {formatCount(taskCount, "task")} created
        </p>
      </div>
      <p className="mt-2 text-sm text-slate">Saved together. Each person now sees only the work assigned to them.</p>

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {projects.map((p) => {
          const hours = p.totalHours ?? hoursById.get(p.id);
          return (
            <li key={p.id}>
              <Link
                href={`/projects/${encodeURIComponent(p.id)}`}
                className="group flex min-h-12 items-center gap-3 px-1 py-3 text-sm transition-colors hover:bg-lagoon-tint/60"
              >
                <ProjectDot color={colorFor(hues, p.id)} />
                <span className="min-w-0 flex-1 truncate font-medium text-ink group-hover:text-lagoon-dark">
                  {p.name}
                </span>
                <span className="tabular shrink-0 text-slate">{formatCount(p.taskCount, "task")}</span>
                {typeof hours === "number" ? (
                  <span className="tabular w-12 shrink-0 text-right text-ink">{formatHours(hours)} h</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <Button asChild>
          <Link href="/">View projects</Link>
        </Button>
      </div>
    </div>
  );
}
