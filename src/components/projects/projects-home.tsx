"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { useSession } from "@/components/layout/session-context";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadError } from "@/components/shared/load-error";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { RoleRedirect } from "@/components/shared/role-redirect";
import { getProjects } from "@/lib/api";
import { HOME_FOR_ROLE } from "@/lib/constants";
import { formatCount } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { ProjectGrid, ProjectGridSkeleton } from "./project-grid";

/** "/" for the admin (all projects) and managers (their projects). Developers go to My tasks. */
export function ProjectsHome() {
  const user = useSession();
  if (!user) return <PageSkeleton />;
  if (user.role === "AGENT") return <RoleRedirect to={HOME_FOR_ROLE.AGENT} />;
  return <ProjectsList isAdmin={user.role === "ADMIN"} />;
}

function ProjectsList({ isAdmin }: { isAdmin: boolean }) {
  const projects = useApi("projects", getProjects);
  const title = isAdmin ? "Projects" : "My projects";

  if (projects.status === "loading") {
    return (
      <>
        <PageHeader title={title} description={<span className="sr-only">Loading projects</span>} />
        <ProjectGridSkeleton />
      </>
    );
  }

  if (projects.status === "error") {
    return (
      <>
        <PageHeader title={title} />
        <LoadError error={projects.error} onRetry={projects.reload} what="projects" />
      </>
    );
  }

  const list = projects.data;
  const taskTotal = list.reduce((n, p) => n + p.taskCount, 0);

  return (
    <>
      <PageHeader
        title={title}
        description={
          list.length > 0 ? (
            <span className="tabular">
              {formatCount(list.length, "project")} · {formatCount(taskTotal, "task")}
            </span>
          ) : null
        }
      />
      {list.length === 0 ? (
        isAdmin ? (
          <EmptyState
            title="No projects yet"
            description="Paste a meeting transcript and NovaWorks creates the projects and tasks for you."
            action={
              <Button asChild variant="secondary">
                <Link href="/transcript">Create from transcript</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No projects are assigned to you yet."
            description="Projects appear here after the admin creates them from a meeting."
          />
        )
      ) : (
        <ProjectGrid projects={list} />
      )}
    </>
  );
}
