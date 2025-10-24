"use client";

export default function CaseOverview({ caseData }) {
  if (!caseData) {
    return (
      <div className="p-6 bg-white rounded-xl shadow">
        <p className="text-sm text-slate-500">Loading case info...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-4">
      <div>
        <p className="text-xs uppercase text-slate-400">Case title</p>
        <h1 className="text-2xl font-semibold text-slate-800">{caseData.title}</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase text-slate-400">Status</p>
          <p className="text-lg font-medium">{caseData.status || "open"}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase text-slate-400">Created</p>
          <p className="text-lg font-medium">
            {new Date(caseData.created_at).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase text-slate-400">Owner</p>
          <p className="text-lg font-medium">{caseData.owner_email || "You"}</p>
        </div>
      </div>
      <div className="rounded-lg border p-4 bg-slate-50">
        <p className="text-sm text-slate-600">
          Coming soon: key deadlines, recent activity, and AI summaries will live here so you have a single glance view before diving into docs.
        </p>
      </div>
    </div>
  );
}
