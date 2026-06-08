/*"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: () => <ChevronLeft className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar }; */

"use client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function CalendarButton(props: React.ComponentProps<"button">) {
  return <button type="button" {...props} />;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "border-border text-foreground dark:bg-background relative rounded-xl border bg-white p-4 shadow-md",
        className,
      )}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        month_caption: "relative z-0 flex h-10 items-center justify-center",
        caption_label: "text-base font-bold",
        nav: "pointer-events-none absolute left-4 right-4 top-4 z-20 flex h-10 items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "pointer-events-auto relative z-30 h-8 w-8 p-0 opacity-70 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "pointer-events-auto relative z-30 h-8 w-8 p-0 opacity-70 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday:
          "flex-1 text-center text-sm font-semibold text-muted-foreground",
        weeks: "mt-2",
        week: "flex w-full",
        day: "flex h-10 flex-1 items-center justify-center p-0 text-center text-sm",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-md p-0 text-sm font-medium",
        ),
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        today: "border border-primary text-primary font-bold",
        outside: "text-muted-foreground opacity-40",
        disabled: "cursor-not-allowed text-muted-foreground opacity-30",
        range_middle: "bg-accent text-accent-foreground",
        range_start: "bg-primary text-primary-foreground",
        range_end: "bg-primary text-primary-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Button: CalendarButton,
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";
export { Calendar };
