import {
  AlignLeft,
  Calculator,
  Calendar,
  CalendarClock,
  CheckSquare,
  ChevronDownSquare,
  Grid3x3,
  Hash,
  Heading,
  Link2,
  ListChecks,
  Lock,
  Paperclip,
  Repeat,
  Search,
  Type,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface FieldTypeMeta {
  value: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  group:
    "Text" | "Choices" | "Dates" | "People & records" | "Layout & advanced";
}

export const FIELD_TYPE_GROUPS = [
  "Text",
  "Choices",
  "Dates",
  "People & records",
  "Layout & advanced",
] as const;

export const FIELD_TYPE_META: readonly FieldTypeMeta[] = [
  {
    value: "SHORT_TEXT",
    label: "Short text",
    hint: "A name, a title, one line",
    icon: Type,
    group: "Text",
  },
  {
    value: "LONG_TEXT",
    label: "Long text",
    hint: "A reason or description",
    icon: AlignLeft,
    group: "Text",
  },
  {
    value: "NUMBER",
    label: "Number",
    hint: "Amounts, counts",
    icon: Hash,
    group: "Text",
  },
  {
    value: "DROPDOWN",
    label: "Dropdown",
    hint: "Pick one option",
    icon: ChevronDownSquare,
    group: "Choices",
  },
  {
    value: "MULTI_SELECT",
    label: "Multiple choice",
    hint: "Pick several options",
    icon: ListChecks,
    group: "Choices",
  },
  {
    value: "CHECKBOX",
    label: "Checkbox",
    hint: "Yes / no",
    icon: CheckSquare,
    group: "Choices",
  },
  {
    value: "DATE",
    label: "Date",
    hint: "A day",
    icon: Calendar,
    group: "Dates",
  },
  {
    value: "DATETIME",
    label: "Date & time",
    hint: "A day and a time",
    icon: CalendarClock,
    group: "Dates",
  },
  {
    value: "USER_PICKER",
    label: "Person",
    hint: "Choose an employee",
    icon: UserRound,
    group: "People & records",
  },
  {
    value: "LOOKUP",
    label: "Lookup",
    hint: "From a list or the service catalog",
    icon: Search,
    group: "People & records",
  },
  {
    value: "REQUEST_LINK",
    label: "Linked request",
    hint: "Point to another request",
    icon: Link2,
    group: "People & records",
  },
  {
    value: "FILE",
    label: "File",
    hint: "An attachment",
    icon: Paperclip,
    group: "People & records",
  },
  {
    value: "SECTION_HEADER",
    label: "Section heading",
    hint: "Split the form into parts",
    icon: Heading,
    group: "Layout & advanced",
  },
  {
    value: "SYSTEM_FIELD",
    label: "Requester info",
    hint: "Filled in automatically",
    icon: Lock,
    group: "Layout & advanced",
  },
  {
    value: "COMPUTED",
    label: "Calculated",
    hint: "Worked out from other fields",
    icon: Calculator,
    group: "Layout & advanced",
  },
  {
    value: "SCORED_MATRIX",
    label: "Scored matrix",
    hint: "Rate rows against columns",
    icon: Grid3x3,
    group: "Layout & advanced",
  },
  {
    value: "REPEATER",
    label: "Repeating group",
    hint: "A table of rows",
    icon: Repeat,
    group: "Layout & advanced",
  },
];

export function fieldTypeMeta(type: string): FieldTypeMeta {
  return (
    FIELD_TYPE_META.find((meta) => meta.value === type) ?? {
      value: type,
      label: type,
      hint: "",
      icon: Type,
      group: "Layout & advanced",
    }
  );
}

/** "Business justification" → "business_justification". */
export function fieldKeyFromLabel(label: string): string {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "field"
  );
}

/**
 * Rename a field key inside any JSON value (visibility rules, formulas):
 * every `{ field: from }` operand becomes `{ field: to }`.
 */
export function renameFieldRefs<T>(value: T, from: string, to: string): T {
  if (Array.isArray(value)) {
    return value.map((item) => renameFieldRefs(item, from, to)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = k === "field" && v === from ? to : renameFieldRefs(v, from, to);
    }
    return out as T;
  }
  return value;
}
