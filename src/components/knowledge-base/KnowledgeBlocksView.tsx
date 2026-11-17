import type { KnowledgeBlock } from "@/lib/knowledge-base/schema";
import { cn } from "@/lib/utils";

/** Returns the 1-based list number for each numbered block (consecutive runs restart at 1). */
export function listNumbers(blocks: readonly KnowledgeBlock[]): number[] {
  const numbers: number[] = [];
  let run = 0;
  for (const block of blocks) {
    run = block.type === "numbered" ? run + 1 : 0;
    numbers.push(run);
  }
  return numbers;
}

/** Read-only rendering of article blocks. Text only — never HTML. */
export function KnowledgeBlocksView({
  blocks,
  placeholder,
  className,
}: {
  blocks: readonly KnowledgeBlock[];
  placeholder?: string;
  className?: string;
}) {
  const numbers = listNumbers(blocks);
  return (
    <div
      className={cn(
        "text-foreground/90 space-y-4 text-[15px] leading-7 break-words",
        className,
      )}
    >
      {blocks.map((block, index) => {
        const empty = !block.text.trim();
        const text = empty ? (placeholder ?? "") : block.text;
        if (empty && !placeholder) return null;
        const muted = empty ? "text-muted-foreground/60 italic" : "";
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={block.id}
                className={cn(
                  "text-foreground pt-4 text-2xl font-semibold tracking-tight first:pt-0",
                  muted,
                )}
              >
                {text}
              </h2>
            );
          case "subheading":
            return (
              <h3
                key={block.id}
                className={cn(
                  "text-foreground pt-2 text-lg font-semibold first:pt-0",
                  muted,
                )}
              >
                {text}
              </h3>
            );
          case "quote":
            return (
              <blockquote
                key={block.id}
                className={cn(
                  "border-barq-yellow bg-muted/50 border-l-4 px-4 py-3 whitespace-pre-wrap italic",
                  muted,
                )}
              >
                {text}
              </blockquote>
            );
          case "bullet":
            return (
              <p
                key={block.id}
                className={cn("flex gap-3 whitespace-pre-wrap", muted)}
              >
                <span
                  aria-hidden="true"
                  className="bg-foreground/60 mt-[11px] size-1.5 shrink-0 rounded-full"
                />
                <span className="min-w-0">{text}</span>
              </p>
            );
          case "numbered":
            return (
              <p
                key={block.id}
                className={cn("flex gap-3 whitespace-pre-wrap", muted)}
              >
                <span
                  aria-hidden="true"
                  className="text-muted-foreground w-5 shrink-0 text-right font-medium tabular-nums"
                >
                  {numbers[index]}.
                </span>
                <span className="min-w-0">{text}</span>
              </p>
            );
          default:
            return (
              <p key={block.id} className={cn("whitespace-pre-wrap", muted)}>
                {text}
              </p>
            );
        }
      })}
    </div>
  );
}
