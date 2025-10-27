"use client";

import { useMemo } from "react";

const VIEW_OPTIONS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "agenda", label: "Agenda" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const startOfWeek = (date) => {
  const d = toStartOfDay(date);
  const diff = d.getDay();
  return addDays(d, -diff);
};

const startOfMonthGrid = (date) => {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  return startOfWeek(firstOfMonth);
};

const getMonthMatrix = (reference) => {
  const start = startOfMonthGrid(reference);
  const days = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(addDays(start, i));
  }
  return days;
};

const getWeekDays = (reference) => {
  const start = startOfWeek(reference);
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    days.push(addDays(start, i));
  }
  return days;
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export default function CalendarView({
  view,
  onViewChange,
  referenceDate,
  onNavigate,
  events,
  onSelectDate,
  onSelectEvent,
  loading = false,
  groupByCase = false,
}) {
  const today = toStartOfDay(new Date());

  const monthDays = useMemo(() => getMonthMatrix(referenceDate), [referenceDate]);
  const weekDays = useMemo(() => getWeekDays(referenceDate), [referenceDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    (events || []).forEach((event) => {
      const dayKey = toStartOfDay(new Date(event.event_date)).getTime();
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey).push(event);
    });
    return map;
  }, [events]);

  const agendaEntries = useMemo(() => {
    const sorted = [...(events || [])].sort(
      (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    );
    return sorted;
  }, [events]);

  const renderEventBadge = (event) => (
    <button
      key={event.id}
      onClick={() => onSelectEvent?.(event)}
      className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
    >
      <span className="block truncate">{event.title}</span>
      <span className="text-[10px] font-normal uppercase tracking-wide text-indigo-500">
        {formatTime(event.event_date)}
        {groupByCase && event.case?.title ? ` · ${event.case.title}` : ""}
      </span>
    </button>
  );

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-2">
      {DAY_LABELS.map((label) => (
        <div key={label} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
      ))}
      {monthDays.map((day) => {
        const key = day.getTime();
        const dayEvents = eventsByDay.get(key) || [];
        const isToday = isSameDay(day, today);
        const isCurrentMonth = day.getMonth() === referenceDate.getMonth();
        return (
          <div
            key={key}
            className={`min-h-[120px] rounded-xl border p-2 ${
              isToday ? "border-indigo-500 bg-indigo-50" : "border-slate-100 bg-white"
            } ${!isCurrentMonth ? "opacity-50" : ""}`}
          >
            <button
              onClick={() => onSelectDate?.(day)}
              className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                isToday ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {day.getDate()}
            </button>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((event) => renderEventBadge(event))}
              {dayEvents.length > 3 && (
                <button
                  onClick={() => onSelectDate?.(day)}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  +{dayEvents.length - 3} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-3">
      {weekDays.map((day) => {
        const key = day.getTime();
        const dayEvents = eventsByDay.get(key) || [];
        const isToday = isSameDay(day, today);
        return (
          <div
            key={key}
            className={`rounded-xl border px-3 py-2 ${
              isToday ? "border-indigo-500 bg-indigo-50" : "border-slate-100 bg-white"
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => onSelectDate?.(day)}
                className="text-left text-sm font-semibold text-slate-700 hover:underline"
              >
                {DAY_LABELS[day.getDay()]} {day.getMonth() + 1}/{day.getDate()}
              </button>
              <span className="text-xs text-slate-400">
                {dayEvents.length} item{dayEvents.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-2">
              {dayEvents.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-xs text-slate-400">
                  No events
                </p>
              ) : (
                dayEvents.map((event) => renderEventBadge(event))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderAgendaView = () => (
    <div className="space-y-3">
      {agendaEntries.length === 0 ? (
        <p className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-500">
          No events scheduled.
        </p>
      ) : (
        agendaEntries.map((event) => (
          <button
            key={event.id}
            onClick={() => onSelectEvent?.(event)}
            className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 text-left text-sm text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/60"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                {new Date(event.event_date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="font-semibold text-slate-900">{event.title}</p>
              {event.description ? (
                <p className="text-xs text-slate-500 mt-1">{event.description}</p>
              ) : null}
            </div>
            {groupByCase && event.case?.title ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {event.case.title}
              </span>
            ) : null}
          </button>
        ))
      )}
    </div>
  );

  const renderBody = () => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
          Loading calendar…
        </div>
      );
    }
    if (view === "week") return renderWeekView();
    if (view === "agenda") return renderAgendaView();
    return renderMonthView();
  };

  const renderTitle = () => {
    if (view === "week") {
      const weekStart = startOfWeek(referenceDate);
      const weekEnd = addDays(weekStart, 6);
      return `${weekStart.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })} – ${weekEnd.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: weekEnd.getFullYear() !== weekStart.getFullYear() ? "numeric" : undefined,
      })}`;
    }
    if (view === "agenda") {
      return "Schedule";
    }
    return referenceDate.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white/95 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate?.("prev")}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            ←
          </button>
          <button
            onClick={() => onNavigate?.("today")}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate?.("next")}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            →
          </button>
          <p className="text-sm font-semibold text-slate-800">{renderTitle()}</p>
        </div>
        <div className="flex gap-2">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => onViewChange?.(option.id)}
              className={`rounded-full px-4 py-1 text-xs font-semibold transition ${
                view === option.id
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {renderBody()}
    </section>
  );
}
