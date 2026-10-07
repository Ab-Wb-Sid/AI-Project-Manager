import type { Metadata } from "next";

import { TranscriptGate } from "@/components/transcript/transcript-gate";

export const metadata: Metadata = { title: "Create from transcript" };

export default function TranscriptPage() {
  return <TranscriptGate />;
}
