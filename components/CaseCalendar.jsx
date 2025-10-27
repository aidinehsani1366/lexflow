"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import CalendarView from "./CalendarView";

const reminderOptions = [
  { value: 60, label: "1 hour before" },
  { value: 180, label: "3 hours before" },
  { value: 1440, label: "1 day before" },
  { value: 2880, label: "2 days before" },
  { value: 4320, label: "3 days before" },
];

const emptyForm = {
  id: null,
  title: "",
  description: "",
  event_date: "",
  reminder_minutes: 1440,
  suggested: false,
};

export default function CaseCalendar({ caseId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formState, setFormState] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [viewMode, setViewMode] = useState("month");
  const [referenceDate, setReferenceDate] = useState(new Date());

  const isEditing = Boolean(formState.id);

  const resetForm = () => setFormState(emptyForm);

  const toInputValue = (date) => {
    const iso = new Date(date).toISOString();
    return iso.slice(0, 16);
  };

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

  const loadEvents = async () => {
    if (!caseId) return;
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No session token found");

      const res = await fetch(`/api/cases/${caseId}/events`, {
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
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.title || !formState.event_date) return;
    setSaving(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No session token found");

      const payload = {
        title: formState.title,
        description: formState.description,
        event_date: formState.event_date,
        reminder_minutes: formState.reminder_minutes,
        suggested: formState.suggested,
      };

      let res;
      if (isEditing) {
        res = await fetch(`/api/case-events/${formState.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/cases/${caseId}/events`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
      const respPayload = await res.json();
      if (!res.ok) throw new Error(respPayload.error || "Failed to save event");
      resetForm();
      await loadEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event) => {
    setFormState({
      id: event.id,
      title: event.title,
      description: event.description || "",
      event_date: event.event_date ? toInputValue(event.event_date) : "",
      reminder_minutes: event.reminder_minutes ?? 1440,
      suggested: Boolean(event.suggested),
    });
    setReferenceDate(new Date(event.event_date));
  };

  const handleDelete = async (eventId) => {
    setDeletingId(eventId);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No session token found");

      const res = await fetch(`/api/case-events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to delete event");
      if (formState.id === eventId) resetForm();
      await loadEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId("");
    }
  };

  const handleSelectDate = (date) => {
    setReferenceDate(date);
    setFormState((prev) => ({
      ...prev,
      event_date: toInputValue(date),
    }));
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

  return (
    <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
      <section className="space-y-3 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {isEditing ? "Edit event" : "Add case event"}
          </p>
          <p className="text-sm text-slate-600">
            Track hearings, filing deadlines, and AI-suggested follow-ups. Attendees receive email
            reminders based on the offset you choose.
          </p>
        </header>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Title
            </label>
            <input
              value={formState.title}
              onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Ex: Response due, Hearing, Client call"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Date & time
            </label>
            <input
              type="datetime-local"
              value={formState.event_date}
              onChange={(e) => setFormState((prev) => ({ ...prev, event_date: e.target.value }))}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Reminder
            </label>
            <select
              value={formState.reminder_minutes}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  reminder_minutes: Number(e.target.value),
                }))
              }
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {reminderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Notes
            </label>
            <textarea
              rows={3}
              value={formState.description}
              onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Add context, dial-ins, or next steps"
            />
          </div>
          {formState.suggested ? (
            <p className="text-xs text-amber-600">
              Suggested by AI — confirm details before saving.
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:-translate-y-0.5 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : isEditing ? "Update event" : "Add event"}
            </button>
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => formState.id && handleDelete(formState.id)}
                  disabled={deletingId === formState.id}
                  className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {deletingId === formState.id ? "Deleting…" : "Delete"}
                </button>
              </>
            )}
          </div>
        </form>
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </section>

      <CalendarView
        view={viewMode}
        onViewChange={setViewMode}
        referenceDate={referenceDate}
        onNavigate={handleNavigate}
        events={events}
        onSelectDate={handleSelectDate}
        onSelectEvent={handleEdit}
        loading={loading}
      />
    </div>
  );
}
