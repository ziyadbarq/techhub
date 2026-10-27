import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const INPUT_BASE =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export function TextInput(
  props: InputHTMLAttributes<HTMLInputElement> & { className?: string },
) {
  const { className, ...rest } = props;
  return (
    <input
      className={[INPUT_BASE, className ?? ""].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}

export function TextArea({
  className,
  rows = 4,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={[
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={[
        INPUT_BASE,
        "appearance-none bg-[length:16px_16px] bg-[right_10px_center] bg-no-repeat pr-9",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      // Theme-aware chevron (globals.css flips its stroke in dark mode).
      style={{ backgroundImage: "var(--select-chevron)" }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function FieldLabel({
  children,
  required,
  helper,
}: {
  children: ReactNode;
  required?: boolean;
  helper?: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      <span>
        {children}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {helper ? (
        <span className="text-muted-foreground mt-1 block text-xs font-normal">
          {helper}
        </span>
      ) : null}
    </label>
  );
}
