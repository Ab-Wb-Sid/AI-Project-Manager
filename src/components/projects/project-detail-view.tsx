"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/components/layout/session-context";
import { LoadError } from "@/components/shared/load-error";
import { NotFoundPanel } from "@/components/shared/not-found-panel";
import { ProjectDot } from "@/components/shared/project-dot";
import { PersonName } from "@/components/shared/user-avatar";
import { getProject } from "@/lib/api";
import { HOME_FOR_ROLE } from "@/lib/constants";
import { formatCount, formatDate, formatHours, sumHours } from "@/lib/format";
import { colorFor, useProjectHues } from "@/lib/project-hues";
import { useApi } from "@/lib/use-api";
import type { ProjectDetail } from "@/types/project";
import type { User } from "@/types/user";
import { TaskTable } from "./task-table";

export function ProjectDetailView() {
  const user = useSession();
  if (!user) return <DetailSkeleton />;
  return <ProjectDetailForUser user={user} />;
}

function ProjectDetailForUser({ user }: { user: User }) {
  const { id } = useParams<{ id: string }>();
  const project = useApi(`project:${id}`, () => getProject(id));
  const hues = useProjectHues();
  const isDeveloper = user.role === "AGENT";
  const back = isDeveloper
    ? { href: HOME_FOR_ROLE.AGENT, label: "My tasks" }
    : { href: "/", label: user.role === "ADMIN" ? "Projects" : "My projects" };

  if (project.status === "error") {
    // 404 and 403 look identical: no hint about whether the project exists.
    if (project.error.status === 404 || project.error.status === 403) {
      return <NotFoundPanel backHref={back.href} />;
    }
    return <LoadError error={project.error} onRetry={project.reload} what="this project" />;
  }

  return (
    <>
      <Link
        href={back.href}
        className="-ml-1 inline-flex h-10 items-center gap-1.5 rounded-control px-1 text-sm font-medium text-slate transition-colors hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        {back.label}
      </Link>

      {project.status === "loading" ? (
        <DetailSkeleton />
      ) : (
        <ProjectBody project={project.data} color={colorFor(hues, project.data.id)} isDeveloper={isDeveloper} />
      )}
    </>
  );
}

function ProjectBody({ project, color, isDeveloper }: { project: ProjectDetail; color: string; isDeveloper: boolean }) {
  const hours = sumHours(project.tasks);
  const totalLabel = `${formatHours(hours)} estimated ${hours === 1 ? "hour" : "hours"} across ${formatCount(project.tasks.length, "task")}`;

  return (
    <article className="mt-2">
      <header className="border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <ProjectDot color={color} className="size-3" />
          <h1 className="text-xl font-semibold tracking-[-0.01em]">{project.name}</h1>
        </div>
        <p className="mt-1 pl-6 text-sm text-slate">
          <span className="sr-only">Client: </span>
          {project.clientName}
        </p>

        <dl className="mt-6 grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-3 text-sm sm:grid-cols-[7rem_1fr]">
          <dt className="text-slate">Manager</dt>
          <dd className="min-w-0">
            <PersonName name={project.manager.name} />
          </dd>
          <dt className="text-slate">Deadline</dt>
          <dd className="tabular">{formatDate(project.deadline)}</dd>
          <dt className="text-slate">{isDeveloper ? "Your work" : "Total"}</dt>
          <dd className="tabular">{totalLabel}</dd>
        </dl>
      </header>

      {project.description ? (
        <section aria-labelledby="description-heading" className="border-b border-line py-6">
          <h2 id="description-heading" className="text-sm font-semibold">
            Description
          </h2>
          <p className="mt-2 max-w-[75ch] text-sm text-ink/85">{project.description}</p>
        </section>
      ) : null}

      <section aria-labelledby="tasks-heading" className="pt-6">
        <div className="mb-3">
          <h2 id="tasks-heading" className="text-lg font-semibold">
            Tasks
          </h2>
          {isDeveloper ? <p className="mt-0.5 text-sm text-slate">Showing your tasks in this project.</p> : null}
        </div>
        {project.tasks.length === 0 ? (
          <p className="rounded-card border border-line bg-surface px-4 py-6 text-sm text-slate">
            This project has no tasks.
          </p>
        ) : (
          <TaskTable
            tasks={project.tasks}
            projectDeadline={project.deadline}
            showAssignee={!isDeveloper}
            caption={`Tasks in ${project.name}`}
          />
        )}
      </section>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-2" aria-hidden>
      <Skeleton className="h-8 w-72" />
      <Skeleton className="mt-2 h-4 w-40" />
      <Skeleton className="mt-8 h-4 w-64" />
      <Skeleton className="mt-3 h-4 w-52" />
      <Skeleton className="mt-3 h-4 w-80" />
      <Skeleton className="mt-10 h-48 w-full rounded-card" />
      <p className="sr-only" role="status">
        Loading project
      </p>
    </div>
  );
}
