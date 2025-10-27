"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import { supabase } from "../../../lib/supabaseClient";
import { useProfile } from "../../../lib/useProfile";

const DEFAULT_METRICS = {
  totals: { leads: 0, retained: 0, recent: 0, retentionRate: 0 },
  leadsBySource: [],
  statusBreakdown: [],
  revenueByFirm: [],
};

const RANGE_OPTIONS = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "$0";
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

export default function InsightsPage() {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("90");
  const [scope, setScope] = useState("auto");
  const [firms, setFirms] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const { profile, loading: profileLoading } = useProfile();

  const isAdmin = profile?.role === "admin";
  const scopeOptions = useMemo(() => {
    if (isAdmin) {
      return [
        { value: "all", label: "All firms" },
        { value: "firm", label: "Specific firm" },
        { value: "mine", label: "My assigned leads" },
      ];
    }
    if (profile?.firm_id) {
      return [
        { value: "firm", label: "My firm" },
        { value: "mine", label: "My assigned" },
      ];
    }
    return [{ value: "mine", label: "My assigned leads" }];
  }, [isAdmin, profile]);

  const effectiveScope = useMemo(() => {
    if (isAdmin) {
      return scope === "auto" ? "all" : scope;
    }
    if (profile?.firm_id) {
      return scope === "auto" ? "firm" : scope;
    }
    return "mine";
  }, [isAdmin, profile, scope]);

  useEffect(() => {
    const fetchFirms = async () => {
      if (!isAdmin) return;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No auth token found");
        const res = await fetch("/api/admin/firms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load firms");
        setFirms(payload.data || []);
      } catch (err) {
        console.error("Failed to load firms for insights filters", err);
      }
    };
    fetchFirms();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && effectiveScope === "firm" && firms.length > 0 && !selectedFirm) {
      setSelectedFirm(firms[0].id);
    }
  }, [isAdmin, effectiveScope, firms, selectedFirm]);

  useEffect(() => {
    const load = async () => {
      if (profileLoading || !profile) return;
      if (effectiveScope === "firm" && isAdmin && !selectedFirm) return;
      setLoading(true);
      setError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No auth token found");
        const params = new URLSearchParams();
        params.set("range", range);
        params.set("scope", effectiveScope);
        if (effectiveScope === "firm" && (isAdmin ? selectedFirm : profile.firm_id)) {
          params.set("firmId", isAdmin ? selectedFirm : profile.firm_id);
        }
        const res = await fetch(`/api/insights?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load insights");
        setMetrics({
          totals: payload.totals || DEFAULT_METRICS.totals,
          leadsBySource: payload.leadsBySource || [],
          statusBreakdown: payload.statusBreakdown || [],
          revenueByFirm: payload.revenueByFirm || [],
        });
      } catch (err) {
        setError(err.message);
        setMetrics(DEFAULT_METRICS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile, profileLoading, range, effectiveScope, selectedFirm, isAdmin]);

  const renderSummaryCard = (label, value, subtext) => (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">
        {loading ? <span className="inline-block h-6 w-24 rounded bg-slate-100" /> : value}
      </p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Analytics</p>
          <h1 className="text-2xl font-semibold text-slate-900">Lead insights</h1>
          <p className="text-sm text-slate-600">
            Track funnel health, source performance, and referral revenue in one glance.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Range</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-slate-600">
            <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Scope</span>
            <select
              value={effectiveScope}
              onChange={(e) => setScope(e.target.value)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              {scopeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {effectiveScope === "firm" && (isAdmin || profile?.firm_id) && (
            <label className="flex items-center gap-2 text-slate-600">
              <span className="text-xs uppercase tracking-[0.25em] text-slate-400">Firm</span>
              <select
                value={isAdmin ? selectedFirm : profile.firm_id || ""}
                onChange={(e) => setSelectedFirm(e.target.value)}
                disabled={!isAdmin}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              >
                {isAdmin ? (
                  <>
                    <option value="">All firms</option>
                    {firms.map((firm) => (
                      <option key={firm.id} value={firm.id}>
                        {firm.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value={profile?.firm_id || ""}>My firm</option>
                )}
              </select>
            </label>
          )}
        </div>

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {renderSummaryCard("Total leads", metrics.totals.leads)}
          {renderSummaryCard("Retained", metrics.totals.retained)}
          {renderSummaryCard(
            "Retention rate",
            `${metrics.totals.retentionRate}%`,
            "Leads that reached retained"
          )}
          {renderSummaryCard("New this week", metrics.totals.recent)}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Leads by source</p>
            {loading ? (
              <p className="text-sm text-slate-500">Loading source data...</p>
            ) : metrics.leadsBySource.length === 0 ? (
              <p className="text-sm text-slate-500">No sources recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {metrics.leadsBySource.map((item) => (
                  <li key={item.source} className="flex items-center justify-between">
                    <span className="capitalize">{item.source.replace("partner:", "partner · ")}</span>
                    <span className="font-semibold">{item.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Conversion funnel</p>
            {loading ? (
              <p className="text-sm text-slate-500">Loading funnel...</p>
            ) : metrics.statusBreakdown.length === 0 ? (
              <p className="text-sm text-slate-500">No funnel data available.</p>
            ) : (
              <ul className="space-y-3 text-sm text-slate-700">
                {metrics.statusBreakdown.map((stage) => {
                  const percent =
                    metrics.totals.leads > 0 ? Math.round((stage.count / metrics.totals.leads) * 100) : 0;
                  return (
                    <li key={stage.status}>
                      <div className="flex items-center justify-between text-xs uppercase text-slate-400">
                        <span>{stage.status}</span>
                        <span>{stage.count}</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-sky-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Referral revenue</p>
          {loading ? (
            <p className="text-sm text-slate-500">Loading referral revenue...</p>
          ) : metrics.revenueByFirm.length === 0 ? (
            <p className="text-sm text-slate-500">No referral fees logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-2">Firm</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Paid</th>
                    <th className="pb-2">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.revenueByFirm.map((row) => (
                    <tr key={row.firm_id} className="border-t border-slate-100">
                      <td className="py-2 font-semibold text-slate-800">{row.firm_name}</td>
                      <td className="py-2">{formatCurrency(row.total)}</td>
                      <td className="py-2 text-emerald-600">{formatCurrency(row.paid)}</td>
                      <td className="py-2 text-amber-600">{formatCurrency(row.pending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
