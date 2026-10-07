"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "./api";
import { hardNavigate } from "./navigation";

export type ApiState<T> =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "ready"; data: T; error?: undefined }
  | { status: "error"; data?: undefined; error: ApiError };

function toApiError(e: unknown) {
  return e instanceof ApiError ? e : new ApiError(0, e instanceof Error ? e.message : "Request failed");
}

/**
 * Loads data for a screen. `key` identifies the request; when it changes, the loader runs again.
 * A 401 means the session ended, so the whole app goes back to the login screen.
 */
export function useApi<T>(key: string, loader: () => Promise<T>) {
  const [result, setResult] = useState<{ key: string; state: ApiState<T> } | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loader().then(
      (data) => {
        if (!cancelled) setResult({ key, state: { status: "ready", data } });
      },
      (e: unknown) => {
        if (cancelled) return;
        const error = toApiError(e);
        if (error.status === 401) {
          hardNavigate("/login");
          return;
        }
        setResult({ key, state: { status: "error", error } });
      },
    );
    return () => {
      cancelled = true;
    };
    // The loader is recreated each render; `key` and `nonce` decide when to refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const state: ApiState<T> = result && result.key === key ? result.state : { status: "loading" };
  return { ...state, reload };
}
