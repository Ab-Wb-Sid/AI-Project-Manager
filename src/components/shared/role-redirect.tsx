"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Sends a role away from a screen that isn't theirs (e.g. a developer opening "/").
 * This is navigation only; the server refuses the data regardless.
 */
export function RoleRedirect({ to }: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return (
    <p role="status" className="sr-only">
      Redirecting
    </p>
  );
}
