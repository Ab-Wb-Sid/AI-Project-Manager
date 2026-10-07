import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/api";
import { StatusBanner } from "./status-banner";

/** A read failed for a reason other than "not signed in" or "not found". */
export function LoadError({ error, onRetry, what }: { error: ApiError; onRetry: () => void; what: string }) {
  const offline = error.status === 0;
  return (
    <StatusBanner
      tone="error"
      title={offline ? `NovaWorks couldn't reach the server, so ${what} didn't load.` : `${capitalize(what)} didn't load.`}
      action={
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      }
    >
      {offline ? "Check your connection, then try again." : "The server returned an error. Try again in a moment."}
    </StatusBanner>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
