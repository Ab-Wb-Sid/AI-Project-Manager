import type { Metadata } from "next";

import { TeamDirectory } from "@/components/team/team-table";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return <TeamDirectory />;
}
