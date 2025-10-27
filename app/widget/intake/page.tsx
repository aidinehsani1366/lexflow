"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type LeadFormState = {
  contact_name: string;
  email: string;
  phone: string;
  case_type: string;
  jurisdiction: string;
  summary: string;
  consent: boolean;
};

const EMPTY_FORM: LeadFormState = {
  contact_name: "",
  email: "",
  phone: "",
  case_type: "",
  jurisdiction: "",
  summary: "",
  consent: false,
};

export default function PartnerIntakeWidget() {
  const searchParams = useSearchParams();
  const firmId = searchParams.get("firm") || "";
  const partnerName = searchParams.get("partnerName") || "";
  const brandColor = searchParams.get("brandColor") || "#0f172a";
  const hostPage = searchParams.get("host") || "";
  const customSource = searchParams.get("source") || "";

  const [form, setForm] = useState<LeadFormState>({ ...EMPTY_FORM });
  const [status, setStatus] = useState({ submitting: false, message: "" });

  const consentCopy = useMemo(() => {
    if (partnerName) {
      return `I agree that ${partnerName} and LexFlow may contact me and that my IP address is logged for compliance.`;
    }
    return "I agree that LexFlow and its partner firms may contact me and that my IP address is logged for compliance.";
  }, [partnerName]);

  const sourceTag = useMemo(() => {
    if (customSource) return customSource;
    if (firmId) return `partner:${firmId}`;
    return "partner_widget";
  }, [customSource, firmId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.consent) {
      setStatus({
        submitting: false,
        message: "Please acknowledge consent so we can route your inquiry.",
      });
      return;
    }
    setStatus({ submitting: true, message: "" });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          source: sourceTag,
          firm_id: firmId || null,
          consent: form.consent,
          consent_text: consentCopy,
          metadata: {
            partner_widget: true,
            partner_name: partnerName || null,
            host_page: hostPage || null,
          },
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Submission failed");
      }
      setForm({ ...EMPTY_FORM });
      setStatus({
        submitting: false,
        message: "Thanks! A LexFlow coordinator will be in touch shortly.",
      });
    } catch (err) {
      setStatus({
        submitting: false,
        message: err instanceof Error ? err.message : "Submission failed. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-xl px-4">
        <div className="rounded-2xl border border-slate-100 bg-white/95 p-6 shadow-xl">
          <header className="mb-6 space-y-1 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {partnerName ? `${partnerName} · Powered by LexFlow` : "LexFlow Trusted Intake"}
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">Share your matter details</h1>
            <p className="text-sm text-slate-500">
              We route submissions directly to the assigned firm with full consent + audit trails.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Full name
                </label>
                <input
                  required
                  value={form.contact_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Email</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="(415) 555-1234"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Jurisdiction
                </label>
                <input
                  value={form.jurisdiction}
                  onChange={(e) => setForm((prev) => ({ ...prev, jurisdiction: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="State or agency"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Case type</label>
              <input
                value={form.case_type}
                onChange={(e) => setForm((prev) => ({ ...prev, case_type: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Employment, Personal injury, etc."
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Summary</label>
              <textarea
                required
                rows={4}
                value={form.summary}
                onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="Briefly describe your situation..."
              />
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={form.consent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    consent: e.target.checked,
                  }))
                }
                required
              />
              <span>{consentCopy}</span>
            </label>
            {status.message && (
              <p className="text-sm text-slate-500" role="status">
                {status.message}
              </p>
            )}
            <button
              type="submit"
              disabled={status.submitting || !form.consent}
              className="w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{
                backgroundColor: brandColor,
                boxShadow: `0 10px 20px ${brandColor}33`,
              }}
            >
              {status.submitting ? "Submitting..." : "Send secure intake"}
            </button>
            <p className="text-center text-[11px] uppercase tracking-[0.25em] text-slate-400">
              Powered by LexFlow · SOC 2 ready
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
