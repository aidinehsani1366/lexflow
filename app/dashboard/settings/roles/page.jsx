"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import DashboardLayout from "../../../../components/DashboardLayout";
import { supabase } from "../../../../lib/supabaseClient";
import { useProfile } from "../../../../lib/useProfile";

const ROLE_OPTIONS = [
  { value: "admin", label: "Super Admin" },
  { value: "firm_admin", label: "Firm Admin" },
  { value: "firm_staff", label: "Firm Staff" },
];

const DEFAULT_EMBED_ORIGIN =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "";

export default function RolesPage() {
  const [profiles, setProfiles] = useState([]);
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [firmForm, setFirmForm] = useState({ name: "", contact_email: "" });
  const [firmMessage, setFirmMessage] = useState("");
  const [firmSubmitting, setFirmSubmitting] = useState(false);
  const [embedOrigin, setEmbedOrigin] = useState(DEFAULT_EMBED_ORIGIN);
  const [copiedFirmId, setCopiedFirmId] = useState("");
  const { profile, loading: profileLoading } = useProfile();
  const isSuperAdmin = profile?.role === "admin";

  const fetchProfiles = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch("/api/admin/profiles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load profiles");
      setProfiles(payload.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFirms = async () => {
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
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (isSuperAdmin) fetchFirms();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (!DEFAULT_EMBED_ORIGIN && typeof window !== "undefined") {
      setEmbedOrigin(window.location.origin);
    }
  }, []);

  const handleFirmSubmit = async (e) => {
    e.preventDefault();
    setFirmSubmitting(true);
    setFirmMessage("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch("/api/admin/firms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(firmForm),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to create firm");
      setFirms((prev) => [...prev, payload.data]);
      setFirmForm({ name: "", contact_email: "" });
      setFirmMessage("Firm added.");
    } catch (err) {
      setFirmMessage(err.message);
    } finally {
      setFirmSubmitting(false);
    }
  };

  const buildSnippet = (firm) => {
    const base = embedOrigin || "https://your-lexflow-domain.com";
    return `<script async src="${base}/partner-intake.js" data-firm="${firm.id}" data-partner-name="${firm.name}" data-height="640"></script>`;
  };

  const handleCopySnippet = async (firm) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      alert("Clipboard access unavailable in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(buildSnippet(firm));
      setCopiedFirmId(firm.id);
      setTimeout(() => setCopiedFirmId(""), 2000);
    } catch (err) {
      console.error("Failed to copy snippet", err);
    }
  };

  const updateProfile = async (userId, role, firmId) => {
    setUpdatingId(userId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch("/api/admin/profiles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role, firmId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to update profile");
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.id === payload.data.id
            ? { ...profile, role: payload.data.role, firm_id: payload.data.firm_id }
            : profile
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm space-y-4">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Settings</p>
          <h1 className="text-2xl font-semibold text-slate-900">Team roles</h1>
          <p className="text-sm text-slate-600">
            Promote teammates to super admin, assign firm access, or limit accounts to internal staff.
          </p>
        </header>

        {isSuperAdmin && (
          <section className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Firms</p>
              <p className="text-sm text-slate-600">
                Add partner firms so their users can be assigned leads.
              </p>
              <Link
                href="/docs/partner-widget"
                className="text-xs font-semibold text-indigo-600 underline"
              >
                View widget documentation →
              </Link>
            </div>
            <form className="space-y-3" onSubmit={handleFirmSubmit}>
              <input
                value={firmForm.name}
                onChange={(e) => setFirmForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Firm name"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <input
                value={firmForm.contact_email}
                onChange={(e) =>
                  setFirmForm((prev) => ({ ...prev, contact_email: e.target.value }))
                }
                placeholder="Contact email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              {firmMessage && (
                <p className="text-xs text-slate-500">{firmMessage}</p>
              )}
              <button
                type="submit"
                disabled={firmSubmitting}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:-translate-y-0.5 transition disabled:opacity-60"
              >
                {firmSubmitting ? "Adding..." : "Add firm"}
              </button>
            </form>
            {firms.length > 0 ? (
              <div className="space-y-3 text-sm text-slate-600">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Embed widget</p>
                <p className="text-xs text-slate-500">
                  Paste this script onto partner sites. It renders a secure LexFlow intake form and
                  auto-tags submissions with the firm.
                </p>
                <ul className="space-y-2">
                  {firms.map((firm) => (
                    <li key={firm.id} className="rounded-xl border border-slate-100 px-3 py-2 space-y-2">
                      <div>
                        <p className="font-semibold text-slate-800">{firm.name}</p>
                        <p className="text-xs text-slate-400">{firm.contact_email || "No contact listed"}</p>
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-slate-900/90 px-3 py-2 text-[11px] text-slate-100">
                        {buildSnippet(firm)}
                      </pre>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(firm)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          {copiedFirmId === firm.id ? "Copied!" : "Copy snippet"}
                        </button>
                        <a
                          href={`/widget/intake?firm=${firm.id}&partnerName=${encodeURIComponent(
                            firm.name
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Open test form
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Add a firm to generate a white-labeled intake widget snippet.
              </p>
            )}
          </section>
        )}

        {error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error === "Forbidden" ? "You need admin access to manage roles." : error}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">User</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-4 text-sm text-slate-500" colSpan={3}>
                    Loading profiles...
                  </td>
                </tr>
              ) : profiles.length === 0 ? (
                <tr>
                  <td className="py-4 text-sm text-slate-500" colSpan={3}>
                    No profiles found.
                  </td>
                </tr>
              ) : (
                profiles.map((profileRow) => (
                  <tr key={profileRow.id} className="border-t border-slate-100">
                    <td className="py-4">
                      <p className="font-semibold text-slate-800">
                        {profileRow.email || "Unknown"}
                      </p>
                      <p className="text-xs text-slate-400">
                        Joined {new Date(profileRow.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        Firm:
                        {profileRow.firm_id
                          ? ` ${
                              firms.find((firm) => firm.id === profileRow.firm_id)?.name || "Unknown"
                            }`
                          : " Not assigned"}
                      </p>
                    </td>
                    <td className="py-4 capitalize">{profileRow.role}</td>
                    <td className="py-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {ROLE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() =>
                                updateProfile(profileRow.id, option.value, profileRow.firm_id || null)
                              }
                              disabled={
                                profileRow.role === option.value ||
                                updatingId === profileRow.id ||
                                (!isSuperAdmin && option.value === "admin")
                              }
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                profileRow.role === option.value
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
                              } disabled:opacity-50`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        {isSuperAdmin && (
                          <select
                            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 focus:outline-none"
                            value={profileRow.firm_id || ""}
                            onChange={(e) =>
                              updateProfile(profileRow.id, profileRow.role, e.target.value || null)
                            }
                            disabled={updatingId === profileRow.id}
                          >
                            <option value="">No firm</option>
                            {firms.map((firm) => (
                              <option key={firm.id} value={firm.id}>
                                {firm.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
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
