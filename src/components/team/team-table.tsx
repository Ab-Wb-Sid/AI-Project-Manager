"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { LoadError } from "@/components/shared/load-error";
import { PersonName } from "@/components/shared/user-avatar";
import { getTeam } from "@/lib/api";
import { roleLabel } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import type { TeamMember } from "@/types/user";

const ORDER = { MANAGER: 0, AGENT: 1, ADMIN: 2 } as const;

/** Managers first, then developers. The admin account isn't part of the delivery team. */
function sortTeam(members: TeamMember[]) {
  return members
    .filter((m) => m.role !== "ADMIN")
    .sort((a, b) => ORDER[a.role] - ORDER[b.role] || a.id.localeCompare(b.id));
}

/** Read-only directory: name, role, specialization. No emails, skills, or controls. */
export function TeamDirectory() {
  const team = useApi("team", getTeam);

  return (
    <>
      <PageHeader title="Team" description="The people who manage and build NovaWorks projects." />
      {team.status === "loading" ? (
        <div aria-hidden className="rounded-card border border-line bg-surface p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="my-3 h-5 w-full" />
          ))}
        </div>
      ) : team.status === "error" ? (
        <LoadError error={team.error} onRetry={team.reload} what="the team directory" />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <Table>
            <caption className="sr-only">NovaWorks team directory</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Specialization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortTeam(team.data).map((m) => (
                <TableRow key={m.id} className="hover:bg-transparent">
                  <TableCell className="py-3">
                    <PersonName name={m.name} className="font-medium" />
                  </TableCell>
                  <TableCell className="py-3">
                    {roleLabel(m.role)}
                    {m.specialization ? (
                      <span className="block text-xs text-slate sm:hidden">{m.specialization}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden py-3 text-slate sm:table-cell">{m.specialization}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
