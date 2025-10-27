"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import CalendarView from "../../../components/CalendarView";
import { supabase } from "../../../lib/supabaseClient";
import { useProfile } from "../../../lib/useProfile";

export default function CalendarPage() {
  const { profile, loading: profileLoading, error: profileError } = useProfile();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [includePast, setIncludePast] = useState(false);
  const [viewMode, setViewMode] = useState("month");
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedCaseId, setSelectedCaseId] = useState("all");

  const filteredEvents = useMemo(() => {
    if (selectedCaseId === "all") return events;
    return events.filter(
      (event) => (event.case?.id || event.case_id) === selectedCaseId
    );
  }, [events, selectedCaseId]);

  const groupedEvents = useMemo(() => {
    const map = new Map();
    filteredEvents.forEach((event) => {
      const caseId = event.case?.id || event.case_id;
      if (!caseId) return;
      const key = caseId;
      if (!map.has(key)) {
        map.set(key, {
          caseId,
          caseTitle: event.case?.title || "Untitled case",
          events: [],
        });
      }
      map.get(key).events.push(event);
    });
    return Array.from(map.values()).map((entry) => ({
      ...entry,
      events: entry.events.sort(
        (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      ),
    }));
  }, [filteredEvents]);

  const caseOptions = useMemo(() => {
    const options = new Map();
    events.forEach((event) => {
      const caseId = event.case?.id || event.case_id;
      if (!caseId) return;
      if (!options.has(caseId)) {
        options.set(caseId, event.case?.title || "Untitled case");
      }
    });
    return Array.from(options.entries()).map(([id, title]) => ({ id, title }));
  }, [events]);

  const upcomingCount = useMemo(() => {
    return filteredEvents.filter(
      (event) => new Date(event.event_date).getTime() >= Date.now()
    ).length;
  }, [filteredEvents]);

  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const handleNavigate = (direction) => {
    if (direction === "today") {
      setReferenceDate(new Date());
      return;
    }
    if (viewMode === "month") {
      setReferenceDate((prev) => addMonths(prev, direction === "next" ? 1 : -1));
    } else {
      setReferenceDate((prev) => addDays(prev, direction === "next" ? 7 : -7));
    }
  };

  const handleEventSelect = (event) => {
    const caseId = event.case?.id || event.case_id;
    if (caseId) router.push(`/dashboard/case/${caseId}`);
  };

  const handleDateSelect = (date) => {
    setReferenceDate(date);
  };

  const loadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No session token found");
      const res = await fetch(`/api/case-events?includePast=${includePast}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load events");
      setEvents(payload.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading && profile) {
      loadEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading, profile, includePast]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-2 rounded-3xl border border-white/80 bg-white/95 px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Calendar</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Case deadlines & reminders
            </h1>
            <p className="text-sm text-slate-600">
              Review upcoming hearings, filing dates, and AI-suggested follow-ups across every case
              you collaborate on.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <input
                type="checkbox"
                checked={includePast}
                onChange={(e) => setIncludePast(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show past events
            </label>
            <button
              onClick={loadEvents}
              disabled={loading}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {profileError && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {profileError}
          </p>
        )}

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && events.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white/95 p-6 text-sm text-slate-500">
            No events yet. Open a case workspace and add milestones from the Calendar tab.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-100 bg-white/95 p-6 text-sm text-slate-500">
            Loading calendar...
          </div>
        ) : null}

        {!loading && events.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/80 bg-white/95 px-5 py-4 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Schedule snapshot
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {upcomingCount} upcoming event{upcomingCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Filter case</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="all">All cases</option>
                  {caseOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <CalendarView
              view={viewMode}
              onViewChange={setViewMode}
              referenceDate={referenceDate}
              onNavigate={handleNavigate}
              events={filteredEvents}
              onSelectDate={handleDateSelect}
              onSelectEvent={handleEventSelect}
              loading={loading}
              groupByCase={selectedCaseId === "all"}
            />

            {groupedEvents.length > 0 && (
              <div className="space-y-4 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Quick links
                </p>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {groupedEvents.map((entry) => (
                    <Link
                      key={entry.caseId}
                      href={`/dashboard/case/${entry.caseId}`}
                      className="rounded-xl border border-slate-100 px-4 py-3 text-sm text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition"
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Case</p>
                      <p className="font-semibold text-slate-900">{entry.caseTitle}</p>
                      <p className="text-xs text-slate-500">
                        {entry.events.length} event{entry.events.length === 1 ? "" : "s"} scheduled
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
