"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBanner } from "@/components/shared/status-banner";
import { getCurrentUser } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { AppBar, Wordmark } from "./app-bar";
import { SessionContextProvider } from "./session-context";

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1168px] px-4 py-6 sm:px-6 sm:py-8">{children}</div>;
}

/**
 * Loads the session once (GET /api/me) and renders the role's top bar.
 * No session → the shared data hook sends the browser to /login.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const me = useApi("me", getCurrentUser);

  if (me.status === "error") {
    return (
      <PageContainer>
        <div className="mx-auto max-w-lg pt-16">
          <StatusBanner
            tone="error"
            title="NovaWorks couldn't reach the server."
            action={
              <Button variant="secondary" onClick={me.reload}>
                Try again
              </Button>
            }
          >
            Check that the app server is running, then try again.
          </StatusBanner>
        </div>
      </PageContainer>
    );
  }

  // The page always renders (with its own skeleton until the session is known),
  // so navigations show UI immediately.
  const user = me.status === "ready" ? me.data : null;

  return (
    <SessionContextProvider value={user}>
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      {user ? (
        <AppBar user={user} />
      ) : (
        <div className="h-14 border-b border-line bg-surface">
          <div className="mx-auto flex h-full max-w-[1168px] items-center gap-6 px-4 sm:px-6">
            <Wordmark />
            <Skeleton className="hidden h-4 w-40 sm:block" />
          </div>
        </div>
      )}
      <main id="main" tabIndex={-1} className="outline-none">
        <PageContainer>{children}</PageContainer>
      </main>
    </SessionContextProvider>
  );
}
