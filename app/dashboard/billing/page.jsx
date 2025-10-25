"use client";
import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import DashboardLayout from "../../../components/DashboardLayout";
import { usePlan } from "../../../lib/usePlan";

const PLANS = [
  {
    id: "solo",
    name: "Solo",
    price: "$49/mo",
    description: "Independent lawyers managing a focused docket.",
    seats: "1 seat",
    features: ["AI checklists", "Document uploads", "Email reminders"],
  },
  {
    id: "team",
    name: "Team",
    price: "$149/mo",
    description: "Boutique firms collaborating across matters.",
    seats: "Up to 10 seats",
    features: [
      "All Solo features",
      "Case members & roles",
      "AI chat workspace",
      "Priority email support",
    ],
  },
  {
    id: "firm",
    name: "Firm",
    price: "$399/mo",
    description: "Full-service firms needing controls & support.",
    seats: "Unlimited seats",
    features: [
      "Everything in Team",
      "Dedicated success manager",
      "Custom quotas & SSO",
    ],
  },
];

export default function BillingPage() {
  const { plan, loading, error, refresh } = usePlan();
  const [updatingPlan, setUpdatingPlan] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const activePlanId = plan?.plan || "solo";

  const handlePlanChange = async (planId) => {
    if (planId === activePlanId) return;
    setUpdatingPlan(planId);
    setActionError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch("/api/billing/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Plan update failed");
      refresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUpdatingPlan("");
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    setActionError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Unable to open portal");
      window.location.href = payload.url;
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Billing
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-2">Manage your plan</h1>
          <p className="text-sm text-slate-500">
            Update seats, review invoices, or switch tiers in a few clicks.
          </p>
          {error && (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          {actionError && (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {actionError}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full border border-slate-200 px-3 py-1 uppercase tracking-wide text-xs">
              {loading ? "Loading plan..." : `${plan?.plan || "solo"} plan`}
            </span>
            {!loading && (
              <span>Seat limit: {plan?.seat_limit || 1}</span>
            )}
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="ml-auto rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {portalLoading ? "Opening…" : "Manage billing"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((option) => {
            const isActive = option.id === activePlanId;
            return (
              <div
                key={option.id}
                className={`rounded-2xl border p-5 shadow-sm space-y-3 ${
                  isActive ? "border-indigo-200 bg-white" : "border-slate-100 bg-white/90"
                }`}
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {option.name}
                  </p>
                  <p className="text-2xl font-semibold mt-1">{option.price}</p>
                  <p className="text-sm text-slate-500 mt-1">{option.description}</p>
                </div>
                <p className="text-sm font-semibold text-slate-700">{option.seats}</p>
                <ul className="text-sm text-slate-600 space-y-1">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanChange(option.id)}
                  disabled={isActive || updatingPlan === option.id}
                  className={`w-full rounded-full px-4 py-2 text-sm font-semibold ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-700 hover:bg-white"
                  } disabled:opacity-60`}
                >
                  {isActive
                    ? "Current plan"
                    : updatingPlan === option.id
                    ? "Updating..."
                    : "Switch to this plan"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
