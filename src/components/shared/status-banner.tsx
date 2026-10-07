import { AlertTriangle, Check, Info, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "error" | "info";

const TONES: Record<Tone, { box: string; icon: string; Icon: typeof Check }> = {
  success: { box: "border-l-fern bg-surface text-ink", icon: "text-fern", Icon: Check },
  warning: { box: "border-l-marigold bg-marigold-tint text-ink", icon: "text-[#8a5a00]", Icon: AlertTriangle },
  error: { box: "border-l-brick bg-brick-tint text-ink", icon: "text-brick", Icon: XCircle },
  info: { box: "border-l-lagoon bg-lagoon-tint text-ink", icon: "text-lagoon", Icon: Info },
};

/**
 * Icon + text banner. Color is never the only signal: every tone has its own icon and wording.
 * Errors announce assertively (role="alert"); success and info politely (role="status").
 */
export function StatusBanner({
  tone,
  title,
  children,
  action,
  className,
}: {
  tone: Tone;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  const { box, icon, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-control border border-l-4 border-line px-4 py-3", box, className)}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-5 shrink-0", icon)} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {children ? <div className="mt-1 text-sm text-ink/80">{children}</div> : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
