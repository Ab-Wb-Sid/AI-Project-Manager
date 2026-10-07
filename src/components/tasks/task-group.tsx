import Link from "next/link";

import { TaskTable } from "@/components/projects/task-table";
import { ProjectDot } from "@/components/shared/project-dot";
import type { MyTask } from "@/types/task";

/** One project's slice of a developer's work: project name (links to it), its manager, then the tasks. */
export function TaskGroup({ project, tasks, color }: { project: MyTask["project"]; tasks: MyTask[]; color: string }) {
  const headingId = `group-${project.id}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-3 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
        <h2 id={headingId} className="flex items-center gap-2.5 text-lg font-semibold">
          <ProjectDot color={color} />
          <Link
            href={`/projects/${encodeURIComponent(project.id)}`}
            className="rounded-[4px] underline-offset-4 hover:text-lagoon-dark hover:underline"
          >
            {project.name}
          </Link>
        </h2>
        <p className="pl-5 text-sm text-slate sm:pl-0">Manager · {project.manager.name}</p>
      </div>
      <TaskTable tasks={tasks} showAssignee={false} caption={`Your tasks in ${project.name}`} />
    </section>
  );
}
