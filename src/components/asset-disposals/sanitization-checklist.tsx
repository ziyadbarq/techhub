/**
 * Sanitization Checklist Component
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardCheck } from "lucide-react";

interface SanitizationChecklistProps {
  disposalId: string;
  initialChecklist: string;
  readonly: boolean;
  onComplete?: (checklist: string) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const DEFAULT_CHECKLIST_ITEMS = [
  { id: "data-backup", label: "Data backup verified and secured" },
  { id: "data-wipe", label: "Hard drive/storage wiped using approved method" },
  {
    id: "software-licenses",
    label: "Software licenses deactivated/transferred",
  },
  { id: "accessories", label: "All accessories and peripherals removed" },
  { id: "physical-labels", label: "Asset tags and identifying labels removed" },
  { id: "proprietary-data", label: "All proprietary data removed/destroyed" },
  { id: "disposal-method", label: "Disposal method verified and documented" },
  { id: "environmental", label: "Environmental disposal requirements met" },
];

export function SanitizationChecklist({
  initialChecklist,
  readonly,
  onComplete,
}: SanitizationChecklistProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialChecklist) {
      try {
        const parsed = JSON.parse(initialChecklist);
        setItems(parsed.items || []);
        setNotes(parsed.notes || "");
      } catch {
        setItems(
          DEFAULT_CHECKLIST_ITEMS.map((item) => ({
            ...item,
            checked: false,
          })),
        );
      }
    } else {
      setItems(
        DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item, checked: false })),
      );
    }
  }, [initialChecklist]);

  const handleToggleItem = (itemId: string) => {
    if (readonly) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const handleComplete = async () => {
    const allChecked = items.every((item) => item.checked);
    if (!allChecked) {
      return;
    }

    const checklist = JSON.stringify({ items, notes });
    setIsSubmitting(true);
    try {
      await onComplete?.(checklist);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allChecked = items.every((item) => item.checked);
  const progress = items.length
    ? (items.filter((item) => item.checked).length / items.length) * 100
    : 0;

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <ClipboardCheck className="h-5 w-5" />
        Sanitization Checklist
      </h3>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-barq-yellow h-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="mb-4 space-y-3 rounded-lg border p-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start space-x-3">
            <Checkbox
              id={`checklist-${item.id}`}
              checked={item.checked}
              onCheckedChange={() => handleToggleItem(item.id)}
              disabled={readonly}
            />
            <label
              htmlFor={`checklist-${item.id}`}
              className={`flex-1 cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                item.checked ? "line-through opacity-70" : ""
              }`}
            >
              {item.label}
            </label>
          </div>
        ))}
      </div>

      {/* Additional Notes */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium">
          Additional Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional sanitization notes..."
          className="min-h-24"
          disabled={readonly}
        />
      </div>

      {/* Complete Button */}
      {!readonly && (
        <Button
          onClick={handleComplete}
          disabled={!allChecked || isSubmitting}
          className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90 w-full"
        >
          {isSubmitting ? "Completing..." : "Complete Sanitization"}
        </Button>
      )}

      {readonly && (
        <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-center text-sm">
          Sanitization completed
        </div>
      )}
    </div>
  );
}
