"use client";

import { useState, useRef, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface InlineEditableFieldProps {
  name: string;
  placeholder?: string;
  transform?: "uppercase" | "lowercase" | "capitalize";
  optional?: boolean;
  className?: string;
}

export function InlineEditableField({
  name,
  placeholder = "",
  transform,
  optional = false,
  className,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { watch, setValue, formState } = useFormContext();

  const value = watch(name) || "";
  const error = formState.errors[name];
  const displayValue = value || placeholder;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEditing(false);
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    if (transform === "uppercase") {
      newValue = newValue.toUpperCase();
    } else if (transform === "lowercase") {
      newValue = newValue.toLowerCase();
    } else if (transform === "capitalize") {
      newValue = newValue.charAt(0).toUpperCase() + newValue.slice(1);
    }

    setValue(name, newValue, { shouldValidate: true, shouldDirty: true });
  };

  if (isEditing) {
    return (
      <div className="relative inline-block">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "border-input bg-background inline-block h-7 min-w-[120px] rounded-md border px-2 text-sm",
            "focus:ring-ring focus:ring-2 focus:ring-offset-1 focus:outline-none",
            error && "border-destructive focus:ring-destructive",
            className,
          )}
        />
        {error && (
          <span className="text-destructive absolute -bottom-5 left-0 text-xs whitespace-nowrap">
            {error.message as string}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      tabIndex={-1}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors",
        "hover:bg-muted/50 focus:ring-ring hover:underline focus:ring-2 focus:outline-none",
        !value && "text-muted-foreground italic",
        error && "text-destructive",
        className,
      )}
    >
      {displayValue}
      {optional && !value && (
        <span className="text-muted-foreground text-xs">(optional)</span>
      )}
    </button>
  );
}
