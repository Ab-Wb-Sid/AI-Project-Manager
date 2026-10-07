import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * "What was said." The only serif text in the app: the transcript is source material,
 * not a record, and the type says so.
 */
export function TranscriptPane({
  value,
  onChange,
  readOnly,
  dimmed,
  showEmptyHint,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
  dimmed: boolean;
  showEmptyHint: boolean;
}) {
  const count = value.length;
  return (
    <section className="flex min-w-0 flex-col rounded-card border border-line bg-surface">
      <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-3">
        <label htmlFor="transcript" className="text-lg font-semibold">
          Transcript
        </label>
        {readOnly ? <span className="text-xs text-slate">Read-only while this transcript is in use</span> : null}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Textarea
          id="transcript"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          aria-describedby="transcript-meta"
          spellCheck={false}
          placeholder={"Meeting: …\nDate: …\n\nPaste the full transcript here, from the first line to the final recap."}
          className={cn(
            "min-h-[320px] flex-1 resize-y font-serif text-[17px] leading-7 lg:min-h-[480px]",
            "border-transparent px-2 py-1 hover:border-transparent focus-visible:border-transparent sm:px-3",
            readOnly && "cursor-default",
            dimmed && "text-ink/60",
          )}
        />
      </div>
      <p id="transcript-meta" className="border-t border-line px-5 py-2.5 text-xs text-slate">
        {showEmptyHint && count === 0 ? (
          "Paste a transcript to continue."
        ) : (
          <span className="tabular">
            {count.toLocaleString("en-GB")} {count === 1 ? "character" : "characters"}
          </span>
        )}
      </p>
    </section>
  );
}
