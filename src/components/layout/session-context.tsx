"use client";

import { createContext, useContext } from "react";

import type { User } from "@/types/user";

const SessionContext = createContext<User | null>(null);

export const SessionContextProvider = SessionContext.Provider;

/**
 * The signed-in user, as reported by GET /api/me, or null while it loads. Used only to choose
 * what to render; the server decides what data each request may return.
 */
export function useSession(): User | null {
  return useContext(SessionContext);
}
