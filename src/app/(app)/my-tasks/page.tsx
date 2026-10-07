import type { Metadata } from "next";

import { MyTaskList } from "@/components/tasks/my-task-list";

export const metadata: Metadata = { title: "My tasks" };

export default function MyTasksPage() {
  return <MyTaskList />;
}
