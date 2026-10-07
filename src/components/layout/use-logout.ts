"use client";

import { useState } from "react";
import { toast } from "sonner";

import { logout } from "@/lib/api";
import { hardNavigate } from "@/lib/navigation";

/**
 * Ends the session, then does a full page load of /login so no previous user's
 * screens stay mounted in the client.
 */
export function useLogout() {
  const [pending, setPending] = useState(false);
  async function run() {
    if (pending) return;
    setPending(true);
    try {
      await logout();
      hardNavigate("/login");
    } catch {
      setPending(false);
      toast.error("You couldn't be logged out. Check your connection and try again.");
    }
  }
  return { logout: run, pending };
}
