"use client";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import { supabase } from "../../../lib/supabaseClient";
import { useProfile } from "../../../lib/useProfile";

const STATUS_OPTIONS = ["new", "contacted", "assigned", "retained", "closed"];
const ROLE_LABELS = {
  admin: "Super Admin",
  firm_admin: "Firm Admin",
  firm_staff: "Firm Staff",
  user: "Staff",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [firms, setFirms] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const { profile, loading: profileLoading, error: profileError } = useProfile();

  const isSuperAdmin = profile?.role === "admin";

  const fetchFirms = async (token) => {
    try {
      const res = await fetch("/api/admin/firms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load firms");
      setFirms(payload.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllProfiles = async (token) => {
    try {
      const res = await fetch("/api/admin/profiles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load users");
      setAllProfiles(payload.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No auth token found");

        if (isSuperAdmin) {
          fetchFirms(token);
          fetchAllProfiles(token);
        }

        const url =
          statusFilter === "all"
            ? "/api/leads"
            : `/api/leads?status=${encodeURIComponent(statusFilter)}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load leads");
        setLeads(payload.data || []);
        if (!selectedLead && payload.data?.length) {
          setSelectedLead(payload.data[0]);
          setNotes(payload.data[0].referral_notes || "");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (!profileLoading && profile) {
      fetchLeads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, profileLoading, profile]);

  const filteredLeads = useMemo(() => {
    if (statusFilter === "all") return leads;
    return leads.filter((lead) => lead.status === statusFilter);
  }, [leads, statusFilter]);

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setNotes(lead.referral_notes || "");
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedLead) return;
    setUpdating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, referral_notes: notes }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to update lead");

      setLeads((prev) =>
        prev.map((lead) => (lead.id === payload.data.id ? payload.data : lead))
      );
      setSelectedLead(payload.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleFirmAssign = async (firmId) => {
    if (!selectedLead) return;
    setUpdating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firm_id: firmId || null, referral_notes: notes }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to assign firm");
      setLeads((prev) =>
        prev.map((lead) => (lead.id === payload.data.id ? payload.data : lead))
      );
      setSelectedLead(payload.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleUserAssign = async (userId) => {
    if (!selectedLead) return;
    setUpdating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assigned_to: userId || null, referral_notes: notes }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to assign user");
      setLeads((prev) =>
        prev.map((lead) => (lead.id === payload.data.id ? payload.data : lead))
      );
      setSelectedLead(payload.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const firmOptions = firms.map((firm) => ({ value: firm.id, label: firm.name }));
  const selectedFirmName = selectedLead
    ? firms.find((firm) => firm.id === selectedLead.firm_id)?.name || "Unassigned"
    : "";
  const firmUsers = selectedLead
    ? allProfiles.filter((p) => p.firm_id === selectedLead.firm_id)
    : [];

  return (
    <DashboardLayout>
      {profileError && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {profileError}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="space-y-4 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Intake
              </p>
              <h2 className="text-lg font-semibold text-slate-800">Leads</h2>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 focus:outline-none"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </header>
          {error && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <p className="text-sm text-slate-500">Loading leads...</p>
            ) : filteredLeads.length === 0 ? (
              <p className="text-sm text-slate-500">No leads yet.</p>
            ) : (
              filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    selectedLead?.id === lead.id
                      ? "border-indigo-300 bg-indigo-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {lead.contact_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {lead.case_type || "General"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm">
          {selectedLead ? (
            <>
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Lead detail
                  </p>
                  <h2 className="text-xl font-semibold text-slate-800">
                    {selectedLead.contact_name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedLead.email || "No email"} ·{" "}
                    {selectedLead.phone || "No phone"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Firm: {selectedFirmName}
                  </p>
                </div>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updating}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </header>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase text-slate-400">Case type</p>
                  <p className="text-sm text-slate-700">
                    {selectedLead.case_type || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Jurisdiction</p>
                  <p className="text-sm text-slate-700">
                    {selectedLead.jurisdiction || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Summary</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">
                    {selectedLead.summary || "No summary provided."}
                  </p>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                  <div>
                    <p className="text-xs uppercase text-slate-400">Assign firm</p>
                    <select
                      value={selectedLead.firm_id || ""}
                      onChange={(e) => handleFirmAssign(e.target.value || null)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Unassigned</option>
                      {firmOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Assign user</p>
                    <select
                      value={selectedLead.assigned_to || ""}
                      onChange={(e) => handleUserAssign(e.target.value || null)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      disabled={!selectedLead.firm_id}
                    >
                      <option value="">Unassigned</option>
                      {firmUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email || user.id} ({ROLE_LABELS[user.role] || user.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
                <p className="text-xs uppercase text-slate-400">Referral notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => handleStatusChange(selectedLead.status)}
                    disabled={updating}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:-translate-y-0.5 transition disabled:opacity-60"
                  >
                    {updating ? "Saving..." : "Save notes"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Select a lead from the left panel to see details.
            </p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
