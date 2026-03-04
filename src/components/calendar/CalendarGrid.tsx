import { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isToday,
  isSameMonth,
  getDate,
} from "date-fns";
import { CalendarDay, type CalendarPost } from "./CalendarDay";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface CalendarGridProps {
  posts: Map<string, CalendarPost[]>;
}

export function CalendarGrid({ posts }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="rounded-lg border border-meta-border bg-meta-surface shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-meta-border px-4 py-3">
        <h3 className="text-lg font-semibold text-meta-text">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-md p-1.5 text-meta-text-secondary hover:bg-meta-hover transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="rounded-md px-3 py-1 text-sm font-medium text-meta-blue hover:bg-meta-blue-light transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-md p-1.5 text-meta-text-secondary hover:bg-meta-hover transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-meta-border">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="border-r border-meta-border px-2 py-2 text-center text-xs font-semibold text-meta-text-secondary last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayPosts = posts.get(dateKey) ?? [];

          return (
            <CalendarDay
              key={dateKey}
              date={getDate(day)}
              isToday={isToday(day)}
              isCurrentMonth={isSameMonth(day, currentMonth)}
              posts={dayPosts}
            />
          );
        })}
      </div>
    </div>
  );
}
