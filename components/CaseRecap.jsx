"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MessageBubble from "./MessageBubble";
import MessageContent from "./MessageContent";

const TIMELINE_LABELS = {
  case_created: "Case created",
  document: "Document uploaded",
  event: "Calendar event",
};

export default function CaseRecap({ caseId }) {
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copying, setCopying] = useState(false);

  const fetchRecap = async () => {
    if (!caseId) return;
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No session token found");

      const res = await fetch(`/api/cases/${caseId}/recap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load recap");
      setRecap(payload.data || null);
    } catch (err) {
      setError(err.message);
      setRecap(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const timeline = useMemo(() => {
    if (!recap?.timeline?.length) return [];
    return recap.timeline.map((item) => ({
      ...item,
      date: new Date(item.timestamp),
    }));
  }, [recap]);

  const overviewText = useMemo(() => {
    if (!recap) return "";
    const pieces = [];
    pieces.push(
      `Case: ${recap.case?.title || "Untitled"} (${recap.case?.status || "Status unknown"})`
    );
    if (recap.stats?.totalDocuments) {
      pieces.push(`${recap.stats.totalDocuments} documents uploaded`);
    }
    if (recap.stats?.upcomingEvents) {
      pieces.push(`${recap.stats.upcomingEvents} upcoming events`);
    }
    if (recap.aiHighlights?.length) {
      pieces.push(`${recap.aiHighlights.length} recent AI notes`);
    }
    return pieces.join(" · ");
  }, [recap]);

  const handleCopySummary = async () => {
    if (!recap) return;
    setCopying(true);
    try {
      const lines = [];
      lines.push(`Case recap: ${recap.case?.title || "Untitled case"}`);
      lines.push(`Status: ${recap.case?.status || "Unknown"}`);
      lines.push("");
      lines.push("Highlights:");
      if (recap.stats?.totalDocuments)
        lines.push(`- ${recap.stats.totalDocuments} documents in workspace`);
      if (recap.stats?.upcomingEvents)
        lines.push(`- ${recap.stats.upcomingEvents} upcoming events`);
      if (recap.aiHighlights?.length)
        lines.push(`- ${recap.aiHighlights.length} recent AI notes saved`);
      if (recap.aiHighlights?.length) {
        lines.push("");
        lines.push("Recent AI notes:");
        recap.aiHighlights.forEach((msg) => {
          lines.push(
            `• ${new Date(msg.created_at).toLocaleString()}: ${msg.content.slice(0, 200)}${
              msg.content.length > 200 ? "…" : ""
            }`
          );
        });
      }
      if (timeline.length) {
        lines.push("");
        lines.push("Timeline:");
        timeline.forEach((item) => {
          lines.push(
            `• ${item.date.toLocaleString()} – ${TIMELINE_LABELS[item.type] || item.type}: ${
              item.title
            }`
          );
        });
      }
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch (err) {
      console.error("Failed to copy recap", err);
    } finally {
      setCopying(false);
    }
  };

  if (!caseId) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-500">
        Select a case to view the recap.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 rounded-full bg-slate-200 animate-pulse" />
        <div className="h-40 rounded-3xl bg-white/80 border border-white/60 animate-pulse" />
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-24 rounded-2xl bg-white/70 border border-white/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {error}{" "}
        <button
          type="button"
          onClick={fetchRecap}
          className="ml-2 rounded-full border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white/80 p-6 text-sm text-slate-500">
        No recap data yet for this case.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between rounded-3xl border border-white/80 bg-white/90 px-6 py-5 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Matter recap</p>
          <h2 className="text-2xl font-semibold text-slate-900">
            {recap.case?.title || "Untitled case"}
          </h2>
          <p className="text-sm text-slate-500">{overviewText}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchRecap}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Refresh recap
          </button>
          <button
            type="button"
            onClick={handleCopySummary}
            disabled={copying}
            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {copying ? "Copying…" : "Copy summary"}
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Documents in workspace" value={recap.stats?.totalDocuments || 0} />
        <StatCard label="Upcoming events" value={recap.stats?.upcomingEvents || 0} />
        <StatCard label="Recent AI notes" value={recap.aiHighlights?.length || 0} />
      </section>

      {recap.aiHighlights?.length ? (
        <section className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-500">Recent AI notes</p>
          <div className="space-y-3">
            {recap.aiHighlights.map((msg) => (
              <MessageBubble key={msg.id} role="ai" timestamp={msg.created_at}>
                <MessageContent content={msg.content} />
              </MessageBubble>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Timeline replay</p>
            <h3 className="text-lg font-semibold text-slate-900">Key events and milestones</h3>
          </div>
        </header>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-500">No timeline entries yet for this case.</p>
        ) : (
          <ol className="space-y-3">
            {timeline.map((item) => (
              <li
                key={`${item.type}-${item.timestamp}-${item.title}`}
                className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      {TIMELINE_LABELS[item.type] || "Event"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{item.title}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {item.date.toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <TimelineDetails item={item} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TimelineDetails({ item }) {
  if (!item.details) return null;
  const detailEntries = Object.entries(item.details).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );
  if (!detailEntries.length) return null;

  return (
    <ul className="mt-2 space-y-1 text-xs text-slate-500">
      {detailEntries.map(([key, value]) => (
        <li key={key}>
          <span className="font-semibold capitalize">{key.replace(/_/g, " ")}:</span>{" "}
          {typeof value === "boolean"
            ? value
              ? "Yes"
              : "No"
            : typeof value === "number"
            ? value
            : String(value)}
        </li>
      ))}
    </ul>
  );
}
