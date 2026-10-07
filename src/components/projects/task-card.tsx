import { PersonName } from "@/components/shared/user-avatar";
import { formatHours, formatTaskDate } from "@/lib/format";
import { TaskDescription, type TaskRowData } from "./task-description";

/** Mobile form of a task row: title, description, then owner / due / hours. */
export function TaskCard({
  task,
  projectDeadline,
  showAssignee,
}: {
  task: TaskRowData;
  projectDeadline?: string;
  showAssignee: boolean;
}) {
  return (
    <article className="px-4 py-4">
      <h3 className="text-base font-medium">{task.title}</h3>
      <TaskDescription text={task.description} className="mt-1 text-sm" />
      <div className="mt-3 flex items-center gap-3 text-sm">
        {showAssignee && task.assignee ? <PersonName name={task.assignee.name} className="min-w-0 flex-1" /> : null}
        <dl className="tabular ml-auto flex shrink-0 items-center gap-4">
          <div className="flex gap-1.5">
            <dt className="text-slate">Due</dt>
            <dd>{formatTaskDate(task.deadline, projectDeadline)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="sr-only">Hours</dt>
            <dd className="font-medium">{formatHours(task.estimatedHours)} h</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
