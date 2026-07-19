/*"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import {
  DayPicker,
  MonthGrid as DayPickerMonthGrid,
  useDayPicker,
  type MonthCaptionProps,
  type MonthGridProps,
} from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const DEFAULT_FROM_YEAR = 1900;
const DEFAULT_TO_YEAR = new Date().getFullYear() + 50;
const YEARS_PER_PAGE = 12;

type CalendarView = "days" | "months" | "years";

interface CalendarViewContextValue {
  view: CalendarView;
  setView: React.Dispatch<React.SetStateAction<CalendarView>>;
}

const CalendarViewContext =
  React.createContext<CalendarViewContextValue | null>(null);

function useCalendarView() {
  const context = React.useContext(CalendarViewContext);

  if (!context) {
    throw new Error("Calendar view context is not available.");
  }

  return context;
}

const DEFAULT_CLASS_NAMES: CalendarProps["classNames"] = {
  months: "flex flex-col gap-4 sm:flex-row sm:gap-4",
  month: "grid grid-cols-[3.5rem_1fr_3.5rem] items-center gap-y-3",
  caption: "flex items-center justify-center pt-0",
  month_caption:
    "col-start-2 row-start-1 flex h-12 items-center justify-center",
  caption_label:
    "inline-flex h-12 items-center justify-center text-center text-sm font-medium leading-none",
  dropdowns: "flex items-center justify-center gap-1",
  dropdown_root:
    "relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md px-2 text-sm font-medium text-foreground",
  dropdown: "absolute inset-0 z-10 cursor-pointer opacity-0",
  months_dropdown: "min-w-[7.5rem]",
  years_dropdown: "min-w-[5.5rem]",
  nav: "flex items-center justify-between",
  nav_button:
    "cursor-pointer flex h-12 w-12 items-center justify-center rounded-xl border-0 bg-transparent p-0 text-muted-foreground/80 shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:bg-transparent focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-default disabled:opacity-40 dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent",
  button_previous:
    "col-start-1 row-start-1 cursor-pointer flex h-12 w-12 items-center justify-center self-center justify-self-start rounded-xl border-0 bg-transparent p-0 text-muted-foreground/80 shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:bg-transparent focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-default disabled:opacity-40 dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent",
  button_next:
    "col-start-3 row-start-1 cursor-pointer flex h-12 w-12 items-center justify-center self-center justify-self-end rounded-xl border-0 bg-transparent p-0 text-muted-foreground/80 shadow-none transition-colors hover:bg-transparent hover:text-foreground focus-visible:bg-transparent focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-default disabled:opacity-40 dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent",
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  table: "w-full border-collapse",
  month_grid: "col-span-3 w-full border-collapse",
  head_row: "flex",
  weekdays: "flex",
  head_cell:
    "size-9 rounded-lg p-0 text-center text-xs font-medium text-muted-foreground/80",
  weekday:
    "size-9 rounded-lg p-0 text-center text-xs font-medium text-muted-foreground/80",
  row: "mt-1 flex w-full",
  week: "mt-1 flex w-full",
  cell: "relative size-9 p-0 text-center text-sm [&:has([aria-selected].day-range-middle)]:bg-accent/70 [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-range-end)]:bg-accent/70 [&:has([aria-selected].day-range-start)]:rounded-l-lg [&:has([aria-selected].day-range-start)]:bg-accent/70 [&:has([aria-selected].day-outside)]:bg-accent/40 focus-within:relative focus-within:z-20",
  day: "relative size-9 p-0 text-center text-sm",
  day_button: cn(
    buttonVariants({ variant: "ghost" }),
    "text-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/70 relative flex size-9 cursor-pointer items-center justify-center rounded-lg border border-transparent p-0 text-sm font-normal whitespace-nowrap transition-[color,background-color,border-radius,box-shadow,opacity] duration-150 outline-none focus-visible:z-10 focus-visible:ring-2 disabled:cursor-default aria-selected:rounded-md aria-selected:bg-white aria-selected:text-black aria-selected:hover:bg-white/90 aria-selected:hover:text-black dark:aria-selected:bg-white dark:aria-selected:text-black dark:aria-selected:hover:bg-white/90 dark:aria-selected:hover:text-black",
  ),
  day_range_end: "day-range-end",
  day_range_start: "day-range-start",
  selected:
    "[&>button]:rounded-md [&>button]:bg-white [&>button]:text-black [&>button]:hover:bg-white/90 [&>button]:hover:text-black [&>button]:focus:bg-white [&>button]:focus:text-black dark:[&>button]:bg-white dark:[&>button]:text-black dark:[&>button]:hover:bg-white/90",
  day_selected:
    "rounded-md !bg-white !text-black hover:!bg-white/90 hover:!text-black focus:!bg-white focus:!text-black dark:!bg-white dark:!text-black dark:hover:!bg-white/90",
  day_today:
    "after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:size-[3px] after:-translate-x-1/2 after:rounded-full after:bg-primary aria-selected:after:bg-background",
  day_outside:
    "day-outside text-muted-foreground/50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground/70",
  day_disabled: "text-muted-foreground opacity-30",
  range_start:
    "rounded-l-lg bg-accent/70 [&>button]:rounded-md [&>button]:bg-white [&>button]:text-black",
  range_end:
    "rounded-r-lg bg-accent/70 [&>button]:rounded-md [&>button]:bg-white [&>button]:text-black",
  range_middle: "bg-accent/70 [&>button]:rounded-none",
  day_range_middle:
    "aria-selected:rounded-none aria-selected:bg-accent aria-selected:text-accent-foreground",
  day_hidden: "invisible",
};

function CustomMonthCaption(captionProps: MonthCaptionProps) {
  const { calendarMonth, ...divProps } = captionProps;
  const { dayPickerProps } = useDayPicker();
  const { setView } = useCalendarView();
  const monthDate = calendarMonth.date;
  const locale = dayPickerProps.locale;
  const monthLabel = monthDate.toLocaleString(locale?.code, { month: "long" });
  const yearLabel = monthDate.getFullYear();

  return (
    <div {...divProps}>
      <button
        type="button"
        className="text-foreground hover:text-foreground/80 inline-flex h-10 items-center justify-center rounded-md px-1 text-sm font-medium transition-colors"
        onClick={() =>
          setView((currentView) =>
            currentView === "months" ? "days" : "months",
          )
        }
      >
        {monthLabel}
      </button>
      <button
        type="button"
        className="text-foreground hover:text-foreground/80 inline-flex h-10 items-center justify-center rounded-md px-1 text-sm font-medium transition-colors"
        onClick={() =>
          setView((currentView) => (currentView === "years" ? "days" : "years"))
        }
      >
        {yearLabel}
      </button>
    </div>
  );
}

function CalendarNavigationButton({
  direction,
  buttonProps,
}: {
  direction: "previous" | "next";
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const { goToMonth, months } = useDayPicker();
  const { view } = useCalendarView();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (view === "days") {
      buttonProps.onClick?.(event);
      return;
    }

    const currentMonth = months[0]?.date ?? new Date();
    const nextMonth =
      view === "months"
        ? new Date(
            currentMonth.getFullYear() + (direction === "next" ? 1 : -1),
            currentMonth.getMonth(),
            1,
          )
        : new Date(
            currentMonth.getFullYear() +
              (direction === "next" ? YEARS_PER_PAGE : -YEARS_PER_PAGE),
            currentMonth.getMonth(),
            1,
          );

    goToMonth(nextMonth);
  };

  return (
    <button
      {...buttonProps}
      type="button"
      aria-disabled={undefined}
      disabled={false}
      onClick={handleClick}
    />
  );
}

function PreviousNavigationButton(
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <CalendarNavigationButton direction="previous" buttonProps={buttonProps} />
  );
}

function NextNavigationButton(
  buttonProps: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <CalendarNavigationButton direction="next" buttonProps={buttonProps} />
  );
}

function CustomMonthGrid(gridProps: MonthGridProps) {
  const { goToMonth, months, dayPickerProps } = useDayPicker();
  const { setView, view } = useCalendarView();
  const currentMonth = months[0]?.date ?? new Date();
  const locale = dayPickerProps.locale?.code;

  if (view === "months") {
    const monthsList = Array.from({ length: 12 }, (_, monthIndex) => {
      const date = new Date(currentMonth.getFullYear(), monthIndex, 1);
      return {
        date,
        label: date.toLocaleString(locale, { month: "short" }),
        isActive: monthIndex === currentMonth.getMonth(),
      };
    });

    return (
      <div className="col-span-3 grid grid-cols-3 gap-2 pt-2">
        {monthsList.map((monthItem) => (
          <button
            key={monthItem.date.toISOString()}
            type="button"
            className={cn(
              "hover:bg-accent flex h-10 cursor-pointer items-center justify-center rounded-md text-sm transition-colors",
              monthItem.isActive && "bg-white text-black hover:bg-white/90",
            )}
            onClick={() => {
              goToMonth(monthItem.date);
              setView("days");
            }}
          >
            {monthItem.label}
          </button>
        ))}
      </div>
    );
  }

  if (view === "years") {
    const startYear =
      Math.floor(currentMonth.getFullYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE;
    const years = Array.from({ length: YEARS_PER_PAGE }, (_, yearIndex) => {
      const year = startYear + yearIndex;
      return {
        year,
        isActive: year === currentMonth.getFullYear(),
      };
    });

    return (
      <div className="col-span-3 grid grid-cols-3 gap-2 pt-2">
        {years.map((yearItem) => (
          <button
            key={yearItem.year}
            type="button"
            className={cn(
              "hover:bg-accent flex h-10 cursor-pointer items-center justify-center rounded-md text-sm transition-colors",
              yearItem.isActive && "bg-white text-black hover:bg-white/90",
            )}
            onClick={() => {
              goToMonth(new Date(yearItem.year, currentMonth.getMonth(), 1));
              setView("months");
            }}
          >
            {yearItem.year}
          </button>
        ))}
      </div>
    );
  }

  return <DayPickerMonthGrid {...gridProps} />;
}

function HiddenWeekdays(_: React.HTMLAttributes<HTMLTableRowElement>) {
  return <></>;
}

function HiddenWeeks(_: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <></>;
}

function Calendar({
  className,
  classNames,
  components,
  fromYear = DEFAULT_FROM_YEAR,
  navLayout = "around",
  showOutsideDays = true,
  toYear = DEFAULT_TO_YEAR,
  ...props
}: CalendarProps) {
  const [view, setView] = React.useState<CalendarView>("days");

  return (
    <CalendarViewContext.Provider value={{ view, setView }}>
      <DayPicker
        fromYear={fromYear}
        navLayout={navLayout}
        showOutsideDays={showOutsideDays}
        toYear={toYear}
        className={cn(
          "bg-background w-fit rounded-lg border p-3 shadow-sm",
          className,
        )}
        classNames={{
          ...DEFAULT_CLASS_NAMES,
          ...classNames,
        }}
        components={{
          MonthCaption: CustomMonthCaption,
          MonthGrid: CustomMonthGrid,
          PreviousMonthButton: PreviousNavigationButton,
          NextMonthButton: NextNavigationButton,
          Chevron: ({
            className: chevronClassName,
            orientation,
            ...iconProps
          }: {
            className?: string;
            disabled?: boolean;
            orientation?: "left" | "right" | "up" | "down";
            size?: number;
          }) => (
            <ChevronLeft
              className={cn(
                "h-5 w-5",
                orientation === "right" && "rotate-180",
                orientation === "up" && "rotate-90",
                orientation === "down" && "-rotate-90",
                chevronClassName,
              )}
              {...iconProps}
            />
          ),
          ...(view !== "days"
            ? {
                Weekdays: HiddenWeekdays,
                Weeks: HiddenWeeks,
              }
            : {}),
          ...components,
        }}
        {...props}
      />
    </CalendarViewContext.Provider>
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
