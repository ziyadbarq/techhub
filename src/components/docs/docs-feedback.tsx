/**
 * DocsFeedback Component
 * "Was this helpful?" feedback widget for documentation pages
 */

"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface DocsFeedbackProps {
  /** Document slug for tracking */
  slug: string;
  className?: string;
}

type FeedbackState = "idle" | "positive" | "negative" | "submitted";

export function DocsFeedback({ slug: _slug, className }: DocsFeedbackProps) {
  const [state, setState] = useState<FeedbackState>("idle");
  const [showTextarea, setShowTextarea] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handlePositive = () => {
    setState("positive");
    // Could send analytics/feedback here
    setTimeout(() => setState("submitted"), 500);
  };

  const handleNegative = () => {
    setState("negative");
    setShowTextarea(true);
  };

  const handleSubmitFeedback = () => {
    // Feedback is not persisted yet; a backend endpoint is required before
    // this can do more than acknowledge the user.
    setState("submitted");
    setShowTextarea(false);
  };

  if (state === "submitted") {
    return (
      <div
        className={cn(
          "border-border bg-muted/30 flex items-center gap-2 rounded-lg border p-4",
          className,
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-muted-foreground text-sm">
          Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "border-border bg-muted/30 rounded-lg border p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-medium">Was this page helpful?</p>

        <div className="flex items-center gap-2">
          <Button
            variant={state === "positive" ? "default" : "outline"}
            size="sm"
            onClick={handlePositive}
            className="gap-1.5"
          >
            <ThumbsUp className="h-4 w-4" />
            Yes
          </Button>
          <Button
            variant={state === "negative" ? "default" : "outline"}
            size="sm"
            onClick={handleNegative}
            className="gap-1.5"
          >
            <ThumbsDown className="h-4 w-4" />
            No
          </Button>
        </div>
      </div>

      {/* Expanded feedback form */}
      {showTextarea && (
        <div className="mt-4 space-y-3">
          <Textarea
            placeholder="What could we improve? (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowTextarea(false);
                setState("idle");
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmitFeedback}>
              Submit Feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
