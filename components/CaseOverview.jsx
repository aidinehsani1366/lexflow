"use client";

export default function CaseOverview({ caseData }) {
  if (!caseData) {
    return (
      <div className="rounded-3xl border border-white bg-white/60 p-8 shadow-sm">
        <p className="text-sm text-slate-500">Loading case overview…</p>
      </div>
    );
  }

  const info = [
    { label: "Status", value: (caseData.status || "open").toUpperCase() },
    { label: "Created", value: new Date(caseData.created_at).toLocaleDateString() },
    { label: "Owner", value: caseData.owner_email || "You" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 p-8 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.4em] text-white/60">
          Case title
        </p>
        <h1 className="mt-4 text-3xl font-semibold leading-tight text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
          <span className="inline-flex rounded-xl bg-black/35 px-4 py-1 text-white backdrop-blur-sm">
            {caseData.title || "Untitled case"}
          </span>
        </h1>
        <p className="mt-3 text-white/75">
          High-level summary, docket notes, and upcoming automations will appear here.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {info.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
        Coming next: timeline of filings, AI summaries, and decision logs so you can
        brief your team in seconds.
      </div>
    </div>
  );
}
