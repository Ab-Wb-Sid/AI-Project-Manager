import { Skeleton } from "@/components/ui/skeleton";
import { buildHueMap, colorFor } from "@/lib/project-hues";
import type { ProjectSummary } from "@/types/project";
import { ProjectCard } from "./project-card";

/** 3 columns at ≥1024px, 2 at ≥640px, 1 below. Cards keep creation-order colors. */
export function ProjectGrid({ projects }: { projects: ProjectSummary[] }) {
  const hues = buildHueMap(projects);
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <li key={p.id}>
          <ProjectCard project={p} color={colorFor(hues, p.id)} />
        </li>
      ))}
    </ul>
  );
}

export function ProjectGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-card border border-line bg-surface p-5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-6 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-6 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
