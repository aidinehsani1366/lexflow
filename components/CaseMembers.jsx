"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePlan } from "../lib/usePlan";

const roleOptions = [
  { value: "editor", label: "Editor • can upload & chat" },
  { value: "viewer", label: "Viewer • read-only" },
];

export default function CaseMembers({ caseId }) {
  const { plan, loading: planLoading, error: planError } = usePlan();
  const [owner, setOwner] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "editor" });
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    if (!caseId) return;
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const fetchMembers = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token");

      const res = await fetch(`/api/cases/${caseId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load members");
      setOwner(payload.data.owner);
      setMembers(payload.data.collaborators || []);
      setIsOwner(payload.data.isOwner);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!invite.email) return;
    setInviting(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token");

      const res = await fetch(`/api/cases/${caseId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invite),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Invite failed");

      setOwner(payload.data.owner);
      setMembers(payload.data.collaborators || []);
      setInvite({ email: "", role: "editor" });
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!confirm("Remove this member from the case?")) return;
    setRemovingId(memberId);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token");

      const res = await fetch(`/api/cases/${caseId}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ memberId }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to remove member");
      setOwner(payload.data.owner);
      setMembers(payload.data.collaborators || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const seatLimit = plan?.seat_limit ?? 1;
  const seatUsage = 1 + members.length;
  const seatsRemaining = seatLimit - seatUsage;
  const planName = plan?.plan || "solo";
  const invitesBlocked =
    planLoading || !plan || planName === "solo" || seatsRemaining <= 0;

  const renderMemberCard = (member, isOwnerCard = false) => (
    <div
      key={member.member_id || member.id}
      className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">{member.email}</p>
        <p className="text-xs text-slate-400">
          {member.role === "owner"
            ? "Owner"
            : member.role === "editor"
            ? "Editor"
            : "Viewer"}
          {" • "}
          Added {new Date(member.created_at).toLocaleDateString()}
        </p>
      </div>
      {isOwner && !isOwnerCard && (
        <button
          onClick={() => handleRemove(member.id)}
          disabled={removingId === member.id}
          className="text-xs uppercase tracking-wide text-red-500 hover:text-red-700"
        >
          {removingId === member.id ? "Removing..." : "Remove"}
        </button>
      )}
    </div>
  );

  if (!caseId) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500">
        Select a case to view team access.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-sm space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Team access
        </p>
        <h2 className="text-2xl font-semibold text-slate-900">Share this workspace</h2>
        <p className="text-sm text-slate-500">
          Invite teammates to collaborate. Editors can upload docs & use AI, viewers get read-only access.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {planError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {planError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {owner && renderMemberCard(owner, true)}
          {members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              No collaborators yet.
            </div>
          ) : (
            members.map((member) => renderMemberCard(member))
          )}
        </div>
      )}

      {isOwner && (
        <div className="space-y-3 rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Invite teammate</p>
            <p className="text-xs text-slate-500">
              Seats {Math.min(seatUsage, seatLimit)}/{seatLimit}
            </p>
          </div>

          {planName === "solo" && !planLoading ? (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-800 space-y-2">
              <p>
                Collaboration requires the Team plan. Upgrade to invite associates, paralegals, and clients.
              </p>
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
              >
                View plans →
              </Link>
            </div>
          ) : seatsRemaining <= 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 space-y-2">
              <p>
                You’ve reached your seat limit. Remove a member or increase your plan to add more collaborators.
              </p>
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-800"
              >
                Manage billing →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-4">
              <input
                type="email"
                required
                placeholder="colleague@firm.com"
                value={invite.email}
                onChange={(e) => setInvite((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <select
                value={invite.role}
                onChange={(e) => setInvite((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={inviting || invitesBlocked}
                className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition disabled:opacity-60"
              >
                {inviting ? "Sending invite..." : "Invite member"}
              </button>
              <p className="text-xs text-slate-400">
                Members must have a LexFlow account to accept. Viewer role launches read-only mode soon.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
