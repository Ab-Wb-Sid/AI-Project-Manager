"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useSession } from "@/components/layout/session-context";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadError } from "@/components/shared/load-error";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { RoleRedirect } from "@/components/shared/role-redirect";
import { getMyTasks } from "@/lib/api";
import { byDeadline, formatCount, formatHours, sumHours } from "@/lib/format";
import { colorFor, useProjectHues } from "@/lib/project-hues";
import { useApi } from "@/lib/use-api";
import type { MyTask } from "@/types/task";
import { TaskGroup } from "./task-group";

/** Groups by project, ordered by each project's earliest due task. */
function groupByProject(tasks: MyTask[]) {
  const groups = new Map<string, { project: MyTask["project"]; tasks: MyTask[] }>();
  for (const t of [...tasks].sort(byDeadline)) {
    const g = groups.get(t.project.id) ?? { project: t.project, tasks: [] };
    g.tasks.push(t);
    groups.set(t.project.id, g);
  }
  return [...groups.values()];
}

export function MyTaskList() {
  const user = useSession();
  if (!user) return <PageSkeleton />;
  if (user.role !== "AGENT") return <RoleRedirect to="/" />;
  return <DeveloperTasks />;
}

function DeveloperTasks() {
  const tasks = useApi("my-tasks", getMyTasks);
  const hues = useProjectHues();

  if (tasks.status === "loading") {
    return (
      <>
        <PageHeader title="My tasks" description={<span className="sr-only">Loading your tasks</span>} />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-3 h-44 w-full rounded-card" />
      </>
    );
  }

  if (tasks.status === "error") {
    return (
      <>
        <PageHeader title="My tasks" />
        <LoadError error={tasks.error} onRetry={tasks.reload} what="your tasks" />
      </>
    );
  }

  const list = tasks.data;
  const hours = sumHours(list);

  return (
    <>
      <PageHeader
        title="My tasks"
        description={
          list.length > 0 ? (
            <span className="tabular">
              {formatCount(list.length, "task")} · {formatHours(hours)} estimated {hours === 1 ? "hour" : "hours"}
            </span>
          ) : null
        }
      />
      {list.length === 0 ? (
        <EmptyState
          title="Nothing is assigned to you yet."
          description="Tasks appear here after the admin creates projects from a meeting."
        />
      ) : (
        <div className="flex flex-col gap-10">
          {groupByProject(list).map((g) => (
            <TaskGroup key={g.project.id} project={g.project} tasks={g.tasks} color={colorFor(hues, g.project.id)} />
          ))}
        </div>
      )}
    </>
  );
}
