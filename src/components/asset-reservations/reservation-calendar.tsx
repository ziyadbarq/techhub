"use client";
"use no memo";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssetReservationDTO } from "@/interface-adapters/dtos/generated/asset-reservation.dto";

interface ReservationCalendarProps {
  reservations: AssetReservationDTO[];
  onView: (reservation: AssetReservationDTO) => void;
}

const STATUS_COLORS = {
  PENDING:
    "bg-yellow-100 border-yellow-400 text-yellow-900 hover:bg-yellow-200",
  CONFIRMED: "bg-blue-100 border-blue-400 text-blue-900 hover:bg-blue-200",
  ACTIVE: "bg-green-100 border-green-400 text-green-900 hover:bg-green-200",
  COMPLETED: "bg-gray-100 border-gray-400 text-gray-600 hover:bg-gray-200",
  CANCELLED: "bg-red-100 border-red-400 text-red-900 hover:bg-red-200",
} as const;

export function ReservationCalendar({
  reservations,
  onView,
}: ReservationCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filter reservations that overlap with current month view
  const visibleReservations = useMemo(() => {
    return reservations.filter((res) => {
      const resStart = new Date(res.startDate);
      const resEnd = new Date(res.endDate);
      return resEnd >= calendarStart && resStart <= calendarEnd;
    });
  }, [reservations, calendarStart, calendarEnd]);

  // Group reservations by day
  const reservationsByDay = useMemo(() => {
    const map = new Map<string, AssetReservationDTO[]>();

    visibleReservations.forEach((reservation) => {
      const resStart = new Date(reservation.startDate);
      const resEnd = new Date(reservation.endDate);

      // Add reservation to each day it spans
      days.forEach((day) => {
        if (day >= resStart && day <= resEnd) {
          const key = format(day, "yyyy-MM-dd");
          const existing = map.get(key) || [];
          existing.push(reservation);
          map.set(key, existing);
        }
      });
    });

    return map;
  }, [visibleReservations, days]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex gap-2 text-xs">
            {Object.entries(STATUS_COLORS).map(([status, colorClass]) => (
              <div key={status} className="flex items-center gap-1">
                <div
                  className={cn(
                    "h-3 w-3 rounded border",
                    colorClass.split(" ")[0],
                    colorClass.split(" ")[1],
                  )}
                />
                <span className="text-muted-foreground">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden rounded-lg border">
        {/* Day Names Header */}
        <div className="bg-muted/50 grid grid-cols-7 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="border-r p-2 text-center text-sm font-medium last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayReservations = reservationsByDay.get(dayKey) || [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] border-r border-b p-2",
                  index % 7 === 6 && "border-r-0",
                  !isCurrentMonth && "bg-muted/20",
                )}
              >
                {/* Day Number */}
                <div
                  className={cn(
                    "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm",
                    isToday && "bg-barq-yellow text-barq-black font-bold",
                    !isCurrentMonth && "text-muted-foreground",
                  )}
                >
                  {format(day, "d")}
                </div>

                {/* Reservations for this day */}
                <div className="space-y-1">
                  {dayReservations.slice(0, 3).map((reservation) => {
                    const status =
                      reservation.status as keyof typeof STATUS_COLORS;
                    return (
                      <button
                        key={reservation.id}
                        onClick={() => onView(reservation)}
                        className={cn(
                          "w-full truncate rounded border px-1 text-left text-xs transition-colors",
                          STATUS_COLORS[status],
                        )}
                        title={`${reservation.assetTag || "Unknown Asset"} - ${reservation.status}`}
                      >
                        {reservation.assetTag || "No tag"}
                      </button>
                    );
                  })}
                  {dayReservations.length > 3 && (
                    <div className="text-muted-foreground text-xs">
                      +{dayReservations.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="text-muted-foreground flex justify-between text-sm">
        <div>
          Showing {visibleReservations.length} reservation
          {visibleReservations.length !== 1 ? "s" : ""} in{" "}
          {format(currentMonth, "MMMM")}
        </div>
      </div>
    </div>
  );
}
