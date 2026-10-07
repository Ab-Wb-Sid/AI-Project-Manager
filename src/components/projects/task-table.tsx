import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PersonName } from "@/components/shared/user-avatar";
import { byDeadline, formatHours, formatTaskDate } from "@/lib/format";
import { TaskCard } from "./task-card";
import { TaskDescription, type TaskRowData } from "./task-description";

export type { TaskRowData };

/**
 * Who, by when, how many hours. A real <table> from 640px up; stacked cards below,
 * so nothing is squeezed sideways on phones. Sorted by due date.
 */
export function TaskTable({
  tasks,
  projectDeadline,
  showAssignee = true,
  caption,
}: {
  tasks: TaskRowData[];
  projectDeadline?: string;
  showAssignee?: boolean;
  caption: string;
}) {
  const rows = [...tasks].sort(byDeadline);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="hidden sm:block">
        <Table className="table-fixed">
          <caption className="sr-only">{caption}</caption>
          <colgroup>
            <col className="w-[28%]" />
            <col />
            {showAssignee ? <col className="w-[11rem]" /> : null}
            <col className="w-[6.5rem]" />
            <col className="w-[5rem]" />
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Task</TableHead>
              <TableHead>Description</TableHead>
              {showAssignee ? <TableHead>Assigned</TableHead> : null}
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>
                  <TaskDescription text={t.description} />
                </TableCell>
                {showAssignee ? (
                  <TableCell>{t.assignee ? <PersonName name={t.assignee.name} /> : null}</TableCell>
                ) : null}
                <TableCell className="tabular whitespace-nowrap">{formatTaskDate(t.deadline, projectDeadline)}</TableCell>
                <TableCell className="tabular text-right">{formatHours(t.estimatedHours)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-line sm:hidden" aria-label={caption}>
        {rows.map((t) => (
          <li key={t.id}>
            <TaskCard task={t} projectDeadline={projectDeadline} showAssignee={showAssignee} />
          </li>
        ))}
      </ul>
    </div>
  );
}
