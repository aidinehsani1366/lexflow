"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import { supabase } from "../../../lib/supabaseClient";
import { useProfile } from "../../../lib/useProfile";

export default function SecurityEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile, loading: profileLoading } = useProfile();

  const isAdmin = profile?.role === "admin";

  const loadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");
      const res = await fetch("/api/security-events?limit=200", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load security events");
      setEvents(payload.data || []);
    } catch (err) {
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profileLoading && isAdmin) {
      loadEvents();
    }
  }, [profileLoading, isAdmin]);

  if (!profileLoading && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-600">
          You need super-admin access to view security logs.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Security</p>
            <h1 className="text-2xl font-semibold text-slate-900">Intake + auth events</h1>
            <p className="text-sm text-slate-600">
              Rate limits, spam blocks, and intake failures recorded by the lead API.
            </p>
          </div>
          <button
            onClick={loadEvents}
            disabled={loading}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Event</th>
                <th className="pb-2">IP / Context</th>
                <th className="pb-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-4 text-sm text-slate-500" colSpan={4}>
                    Loading security events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td className="py-4 text-sm text-slate-500" colSpan={4}>
                    No events logged in this window.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-t border-slate-100 align-top">
                    <td className="py-3 text-xs text-slate-500">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-semibold text-slate-800">{event.event_type}</td>
                    <td className="py-3 text-xs text-slate-500">
                      {event.details?.ip || "—"}
                      {event.details?.email ? ` · ${event.details.email}` : ""}
                    </td>
                    <td className="py-3 text-xs text-slate-500 whitespace-pre-wrap">
                      {event.details
                        ? JSON.stringify(event.details, null, 2)
                        : "No details recorded"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
