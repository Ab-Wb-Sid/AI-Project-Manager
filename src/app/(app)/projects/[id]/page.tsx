import type { Metadata } from "next";

import { ProjectDetailView } from "@/components/projects/project-detail-view";

export const metadata: Metadata = { title: "Project" };

export default function ProjectPage() {
  return <ProjectDetailView />;
}
