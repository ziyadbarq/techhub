"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar, type CalendarProps } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SingleDateCalendarProps = Omit<
  CalendarProps,
  "mode" | "selected" | "onSelect"
>;

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: React.ReactNode;
  buttonClassName?: string;
  contentClassName?: string;
  clearable?: boolean;
  clearLabel?: string;
  clearButtonClassName?: string;
  disabledTrigger?: boolean;
  iconClassName?: string;
  iconPosition?: "start" | "end";
  showIcon?: boolean;
  align?: "start" | "center" | "end";
  renderValue?: (date: Date) => React.ReactNode;
  calendarProps?: SingleDateCalendarProps;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  buttonClassName,
  contentClassName,
  clearable = false,
  clearLabel = "Clear Date",
  clearButtonClassName,
  disabledTrigger = false,
  iconClassName,
  iconPosition = "end",
  showIcon = true,
  align = "start",
  renderValue,
  calendarProps,
}: DatePickerProps) {
  const icon = showIcon ? (
    <CalendarIcon
      className={cn(
        "h-4 w-4 shrink-0 opacity-50",
        iconPosition === "start" ? "mr-2" : "ml-auto",
        iconClassName,
      )}
    />
  ) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            buttonClassName,
          )}
          disabled={disabledTrigger}
        >
          {iconPosition === "start" ? icon : null}
          {value ? (renderValue?.(value) ?? format(value, "PPP")) : placeholder}
          {iconPosition === "end" ? icon : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-auto p-0", contentClassName)}
        align={align}
      >
        <Calendar
          mode="single"
          defaultMonth={calendarProps?.defaultMonth ?? value}
          selected={value}
          onSelect={onChange}
          {...calendarProps}
        />
        {clearable && value ? (
          <div className="border-t p-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(undefined)}
              className={cn("w-full", clearButtonClassName)}
            >
              {clearLabel}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
