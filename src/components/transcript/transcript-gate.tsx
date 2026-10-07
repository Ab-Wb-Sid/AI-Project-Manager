"use client";

import { useSession } from "@/components/layout/session-context";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { RoleRedirect } from "@/components/shared/role-redirect";
import { HOME_FOR_ROLE } from "@/lib/constants";
import { TranscriptWorkspace } from "./transcript-workspace";

/** Non-admins never see this screen. The API also returns 403 for them, so this is UX only. */
export function TranscriptGate() {
  const user = useSession();
  if (!user) return <PageSkeleton />;
  if (user.role !== "ADMIN") return <RoleRedirect to={HOME_FOR_ROLE[user.role]} />;
  return <TranscriptWorkspace />;
}
