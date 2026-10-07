import Link from "next/link";

import { PersonName } from "@/components/shared/user-avatar";
import { ProjectRail } from "@/components/shared/project-dot";
import { formatCount, formatDate, formatHours } from "@/lib/format";
import type { ProjectSummary } from "@/types/project";

/** The whole card is one link to the project. Hover changes the border color only. */
export function ProjectCard({ project, color }: { project: ProjectSummary; color: string }) {
  return (
    <Link
      href={`/projects/${encodeURIComponent(project.id)}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-lagoon"
    >
      <ProjectRail color={color} />
      <div className="flex flex-1 flex-col px-5 pt-4 pb-4 pl-6">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink group-hover:text-lagoon-dark">
          {project.name}
        </h2>
        <p className="mt-0.5 text-sm text-slate">{project.clientName}</p>

        <dl className="mt-5 grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-slate">Manager</dt>
          <dd className="min-w-0">
            <PersonName name={project.manager.name} />
          </dd>
          <dt className="text-slate">Deadline</dt>
          <dd className="tabular">{formatDate(project.deadline)}</dd>
        </dl>
      </div>
      <p className="tabular border-t border-line px-5 py-3 pl-6 text-sm text-slate">
        <span className="font-medium text-ink">{formatCount(project.taskCount, "task")}</span>
        {typeof project.totalHours === "number" ? (
          <>
            <span aria-hidden> · </span>
            <span className="sr-only">, </span>
            {formatHours(project.totalHours)} hours
          </>
        ) : null}
      </p>
    </Link>
  );
}
