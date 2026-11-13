"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Pilcrow,
  Plus,
  Quote,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KnowledgeBlock } from "@/lib/knowledge-base/schema";
import {
  MAX_BLOCKS,
  MAX_BLOCK_TEXT,
  countWords,
  detectShortcut,
  nextBlockType,
  parsePastedText,
  type BlockType,
} from "@/lib/knowledge-base/editor";
import { cn } from "@/lib/utils";
import { listNumbers } from "./KnowledgeBlocksView";

export const BLOCK_STYLES: ReadonlyArray<{
  type: BlockType;
  label: string;
  hint: string;
  icon: typeof Pilcrow;
}> = [
  { type: "paragraph", label: "Text", hint: "", icon: Pilcrow },
  { type: "heading", label: "Heading", hint: "#", icon: Heading1 },
  { type: "subheading", label: "Subheading", hint: "##", icon: Heading2 },
  { type: "bullet", label: "Bulleted list", hint: "-", icon: List },
  { type: "numbered", label: "Numbered list", hint: "1.", icon: ListOrdered },
  { type: "quote", label: "Quote / note", hint: ">", icon: Quote },
];

const TEXT_STYLE: Record<BlockType, string> = {
  paragraph: "text-[15px] leading-7",
  heading: "text-2xl font-semibold leading-snug tracking-tight",
  subheading: "text-lg font-semibold leading-snug",
  bullet: "text-[15px] leading-7",
  numbered: "text-[15px] leading-7",
  quote: "text-[15px] italic leading-7",
};

const PLACEHOLDER: Record<BlockType, string> = {
  paragraph: "Type here — use # for a heading, - for a list, 1. for steps",
  heading: "Heading",
  subheading: "Subheading",
  bullet: "List item",
  numbered: "Step",
  quote: "Quote or important note",
};

export function newBlockId(): string {
  // crypto.randomUUID is only available in secure contexts (HTTPS or localhost).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    return crypto.randomUUID();
  return (
    "b-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

function resize(element: HTMLTextAreaElement | null | undefined) {
  if (!element) return;
  element.style.height = "0px";
  element.style.height = element.scrollHeight + "px";
}

type FocusRequest = { id: string; caret: number };

/**
 * Document-style editor for knowledge articles. Every block is plain text with a
 * type, so content stays safe to store and render. Supports Enter/Backspace
 * splitting and merging, Markdown-style shortcuts, multi-line paste and
 * keyboard reordering (Alt+Shift+↑/↓).
 */
export function KnowledgeBlockEditor({
  blocks,
  onChange,
  toolbarEnd,
  disabled = false,
}: {
  blocks: KnowledgeBlock[];
  onChange: (next: KnowledgeBlock[]) => void;
  toolbarEnd?: ReactNode;
  disabled?: boolean;
}) {
  const refs = useRef(new Map<string, HTMLTextAreaElement>());
  const focusRequest = useRef<FocusRequest | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const numbers = listNumbers(blocks);
  const active = blocks.find((block) => block.id === activeId) ?? null;

  useLayoutEffect(() => {
    for (const element of refs.current.values()) resize(element);
    const request = focusRequest.current;
    if (!request) return;
    const element = refs.current.get(request.id);
    if (!element) return;
    focusRequest.current = null;
    element.focus();
    const caret =
      request.caret < 0
        ? element.value.length
        : Math.min(request.caret, element.value.length);
    element.setSelectionRange(caret, caret);
  });

  useEffect(() => {
    const onResize = () => {
      for (const element of refs.current.values()) resize(element);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const register = useCallback(
    (id: string) => (element: HTMLTextAreaElement | null) => {
      if (element) refs.current.set(id, element);
      else refs.current.delete(id);
    },
    [],
  );

  function focusLater(id: string, caret: number) {
    focusRequest.current = { id, caret };
  }

  function focusNow(id: string, caret: number) {
    const element = refs.current.get(id);
    if (!element) return;
    element.focus();
    const position = caret < 0 ? element.value.length : caret;
    element.setSelectionRange(position, position);
  }

  function setType(id: string, type: BlockType) {
    onChange(
      blocks.map((block) => (block.id === id ? { ...block, type } : block)),
    );
    focusLater(id, -1);
  }

  function moveBlock(index: number, offset: number) {
    const target = index + offset;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    const caret = refs.current.get(blocks[index].id)?.selectionStart ?? -1;
    focusLater(blocks[index].id, caret);
  }

  function duplicateBlock(index: number) {
    if (blocks.length >= MAX_BLOCKS)
      return void toast.warning(
        "An article can have up to " + MAX_BLOCKS + " blocks.",
      );
    const copy = { ...blocks[index], id: newBlockId() };
    onChange([...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)]);
    focusLater(copy.id, -1);
  }

  function removeBlock(index: number) {
    if (blocks.length === 1) {
      onChange([{ ...blocks[0], type: "paragraph", text: "" }]);
      focusLater(blocks[0].id, 0);
      return;
    }
    const next = blocks.filter((_, position) => position !== index);
    onChange(next);
    const neighbour = next[Math.max(0, index - 1)];
    focusLater(neighbour.id, -1);
  }

  function appendBlock() {
    const last = blocks.at(-1);
    if (last && !last.text.trim()) return focusNow(last.id, 0);
    if (blocks.length >= MAX_BLOCKS)
      return void toast.warning(
        "An article can have up to " + MAX_BLOCKS + " blocks.",
      );
    const block: KnowledgeBlock = {
      id: newBlockId(),
      type: "paragraph",
      text: "",
    };
    onChange([...blocks, block]);
    focusLater(block.id, 0);
  }

  function handleChange(block: KnowledgeBlock, element: HTMLTextAreaElement) {
    const value = element.value;
    if (block.type === "paragraph") {
      const shortcut = detectShortcut(value);
      const markerLength = value.length - (shortcut?.text.length ?? 0);
      // Only convert when the marker was just typed at the very start of the block.
      if (
        shortcut &&
        element.selectionStart === markerLength &&
        !detectShortcut(block.text)
      ) {
        onChange(
          blocks.map((entry) =>
            entry.id === block.id
              ? { ...entry, type: shortcut.type, text: shortcut.text }
              : entry,
          ),
        );
        focusLater(block.id, 0);
        return;
      }
    }
    onChange(
      blocks.map((entry) =>
        entry.id === block.id ? { ...entry, text: value } : entry,
      ),
    );
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
    block: KnowledgeBlock,
    index: number,
  ) {
    if (event.nativeEvent.isComposing) return;
    const element = event.currentTarget;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const collapsed = start === end;

    if (
      event.altKey &&
      event.shiftKey &&
      (event.key === "ArrowUp" || event.key === "ArrowDown")
    ) {
      event.preventDefault();
      moveBlock(index, event.key === "ArrowUp" ? -1 : 1);
      return;
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey
    ) {
      event.preventDefault();
      if (block.type !== "paragraph" && !block.text.trim()) {
        setType(block.id, "paragraph");
        return;
      }
      if (blocks.length >= MAX_BLOCKS) {
        toast.warning("An article can have up to " + MAX_BLOCKS + " blocks.");
        return;
      }
      const created: KnowledgeBlock = {
        id: newBlockId(),
        type: nextBlockType(block.type),
        text: block.text.slice(end),
      };
      const next = [...blocks];
      next[index] = { ...block, text: block.text.slice(0, start) };
      next.splice(index + 1, 0, created);
      onChange(next);
      focusLater(created.id, 0);
      return;
    }

    if (event.key === "Backspace" && collapsed && start === 0) {
      if (block.type !== "paragraph") {
        event.preventDefault();
        setType(block.id, "paragraph");
        focusLater(block.id, 0);
        return;
      }
      if (index > 0) {
        event.preventDefault();
        const previous = blocks[index - 1];
        const merged = (previous.text + block.text).slice(0, MAX_BLOCK_TEXT);
        const next = blocks.filter((entry) => entry.id !== block.id);
        next[index - 1] = { ...previous, text: merged };
        onChange(next);
        focusLater(previous.id, previous.text.length);
      }
      return;
    }

    if (
      event.key === "Delete" &&
      collapsed &&
      start === block.text.length &&
      index < blocks.length - 1
    ) {
      event.preventDefault();
      const following = blocks[index + 1];
      const next = blocks.filter((entry) => entry.id !== following.id);
      next[index] = {
        ...block,
        text: (block.text + following.text).slice(0, MAX_BLOCK_TEXT),
      };
      onChange(next);
      focusLater(block.id, start);
      return;
    }

    if (event.key === "ArrowUp" && collapsed && start === 0 && index > 0) {
      event.preventDefault();
      focusNow(blocks[index - 1].id, -1);
      return;
    }
    if (
      event.key === "ArrowDown" &&
      collapsed &&
      start === block.text.length &&
      index < blocks.length - 1
    ) {
      event.preventDefault();
      focusNow(blocks[index + 1].id, 0);
    }
  }

  function handlePaste(
    event: ClipboardEvent<HTMLTextAreaElement>,
    block: KnowledgeBlock,
    index: number,
  ) {
    const raw = event.clipboardData.getData("text/plain");
    if (!raw.trim().includes("\n")) return;
    const parsed = parsePastedText(raw);
    if (parsed.length < 2) return;
    event.preventDefault();

    const element = event.currentTarget;
    const before = block.text.slice(0, element.selectionStart);
    const after = block.text.slice(element.selectionEnd);
    const room = MAX_BLOCKS - blocks.length;
    const [first, ...rest] = parsed;
    const kept = rest.slice(0, Math.max(0, room));
    if (kept.length < rest.length)
      toast.warning(
        "Some pasted lines were skipped — articles are limited to " +
          MAX_BLOCKS +
          " blocks.",
      );

    const replaceCurrent = !before.trim() && !after.trim();
    const head: KnowledgeBlock = replaceCurrent
      ? { ...block, type: first.type, text: first.text }
      : { ...block, text: (before + first.text).slice(0, MAX_BLOCK_TEXT) };
    const created = kept.map((entry) => ({ ...entry, id: newBlockId() }));
    const last = created.at(-1) ?? head;
    const lastLength = last.text.length;
    if (after && !replaceCurrent)
      last.text = (last.text + after).slice(0, MAX_BLOCK_TEXT);

    const next = [...blocks];
    next.splice(index, 1, head, ...created);
    onChange(next);
    focusLater(last.id, lastLength);
  }

  const styleTarget = active ?? blocks.at(-1) ?? null;
  const words = countWords(blocks);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="bg-card rounded-xl border shadow-sm">
        {/* Toolbar */}
        <div
          className="bg-card/95 supports-[backdrop-filter]:bg-card/80 sticky top-16 z-20 flex flex-wrap items-center gap-1 rounded-t-xl border-b px-2 py-1.5 backdrop-blur"
          role="toolbar"
          aria-label="Text style"
        >
          {BLOCK_STYLES.map((style) => {
            const Icon = style.icon;
            const pressed = styleTarget?.type === style.type;
            return (
              <Tooltip key={style.type}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled || !styleTarget}
                    aria-pressed={pressed}
                    aria-label={style.label}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      styleTarget && setType(styleTarget.id, style.type)
                    }
                    className={cn(pressed && "bg-accent text-foreground")}
                  >
                    <Icon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {style.label}
                  {style.hint && (
                    <span className="ml-1.5 opacity-70">{style.hint}</span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
          <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />
          <span className="text-muted-foreground hidden text-xs md:inline">
            Enter: new line · Shift+Enter: line break · Alt+Shift+↑↓: move
          </span>
          <div className="ml-auto flex items-center gap-1">{toolbarEnd}</div>
        </div>

        {/* Writing surface */}
        <div className="px-4 pt-5 pb-4 sm:pr-8 sm:pl-12">
          <div className="space-y-2">
            {blocks.map((block, index) => {
              const isActive = block.id === activeId;
              const showPlaceholder = isActive || blocks.length === 1;
              return (
                <div
                  key={block.id}
                  className={cn(
                    "group/block relative flex items-start gap-3",
                    block.type === "heading" && index > 0 && "pt-4",
                    block.type === "subheading" && index > 0 && "pt-2",
                  )}
                >
                  {/* Block menu */}
                  <div
                    className={cn(
                      "absolute top-0.5 -left-10 hidden transition-opacity sm:block",
                      isActive
                        ? "opacity-100"
                        : "opacity-0 group-hover/block:opacity-100",
                    )}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={disabled}
                          aria-label={"Block " + (index + 1) + " options"}
                          className="text-muted-foreground"
                        >
                          <GripVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-52"
                        onCloseAutoFocus={(event) => event.preventDefault()}
                      >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                          Turn into
                        </DropdownMenuLabel>
                        {BLOCK_STYLES.map((style) => {
                          const Icon = style.icon;
                          return (
                            <DropdownMenuItem
                              key={style.type}
                              onSelect={() => setType(block.id, style.type)}
                              className={cn(
                                block.type === style.type && "bg-accent/60",
                              )}
                            >
                              <Icon /> {style.label}
                              {style.hint && (
                                <span className="text-muted-foreground ml-auto text-xs">
                                  {style.hint}
                                </span>
                              )}
                            </DropdownMenuItem>
                          );
                        })}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={index === 0}
                          onSelect={() => moveBlock(index, -1)}
                        >
                          <ArrowUp /> Move up
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={index === blocks.length - 1}
                          onSelect={() => moveBlock(index, 1)}
                        >
                          <ArrowDown /> Move down
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => duplicateBlock(index)}
                        >
                          <Copy /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => removeBlock(index)}
                          className="text-destructive focus:text-destructive [&_svg]:text-destructive"
                        >
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {block.type === "bullet" && (
                    <span
                      aria-hidden="true"
                      className="bg-foreground/60 mt-[13px] size-1.5 shrink-0 rounded-full"
                    />
                  )}
                  {block.type === "numbered" && (
                    <span
                      aria-hidden="true"
                      className="text-muted-foreground mt-px w-5 shrink-0 text-right text-[15px] leading-7 font-medium tabular-nums"
                    >
                      {numbers[index]}.
                    </span>
                  )}

                  <div
                    className={cn(
                      "min-w-0 flex-1",
                      block.type === "quote" &&
                        "border-barq-yellow bg-muted/50 border-l-4 px-4 py-1.5",
                    )}
                  >
                    <textarea
                      ref={register(block.id)}
                      rows={1}
                      value={block.text}
                      maxLength={MAX_BLOCK_TEXT}
                      disabled={disabled}
                      spellCheck
                      aria-label={
                        (BLOCK_STYLES.find((style) => style.type === block.type)
                          ?.label ?? "Text") +
                        " block " +
                        (index + 1)
                      }
                      placeholder={
                        showPlaceholder ? PLACEHOLDER[block.type] : undefined
                      }
                      onFocus={() => setActiveId(block.id)}
                      onChange={(event) =>
                        handleChange(block, event.currentTarget)
                      }
                      onKeyDown={(event) => handleKeyDown(event, block, index)}
                      onPaste={(event) => handlePaste(event, block, index)}
                      className={cn(
                        "placeholder:text-muted-foreground/50 block w-full resize-none overflow-hidden bg-transparent outline-none disabled:opacity-60",
                        TEXT_STYLE[block.type],
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={appendBlock}
            disabled={disabled}
            className="text-muted-foreground/70 hover:text-foreground mt-3 flex w-full items-center gap-2 rounded-md py-2 text-left text-sm transition-colors"
          >
            <Plus className="size-4" /> Click to add a line
          </button>
        </div>

        <div className="bg-muted/30 text-muted-foreground flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t px-4 py-2 text-xs">
          <span>
            {words} {words === 1 ? "word" : "words"} · {blocks.length}/
            {MAX_BLOCKS} blocks
          </span>
          <span>
            Paste from Word or email — lines and lists are split automatically.
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
