import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const INPUT_BASE =
  "h-11 w-full rounded-[8px] border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)] px-4 text-[16px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-stone)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] disabled:bg-[var(--color-surface-soft)] disabled:text-[var(--color-stone)]";

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
        "w-full rounded-[8px] border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)] px-4 py-3 text-[16px] text-[var(--color-ink)] outline-none transition-colors placeholder:text-[var(--color-stone)] focus:border-[var(--color-brand-blue)] focus:ring-1 focus:ring-[var(--color-brand-blue)] disabled:bg-[var(--color-surface-soft)]",
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
        "appearance-none pr-10 bg-[length:16px_16px] bg-no-repeat bg-[right_16px_center]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%231c1c1e' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
      }}
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
    <label className="block text-[14px] font-medium text-[var(--color-ink)]">
      <span>
        {children}
        {required ? (
          <span className="text-[var(--color-brand-blue)]"> *</span>
        ) : null}
      </span>
      {helper ? (
        <span className="mt-1 block text-[13px] font-normal text-[var(--color-stone)]">
          {helper}
        </span>
      ) : null}
    </label>
  );
}
