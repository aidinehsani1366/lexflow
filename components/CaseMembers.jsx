"use client";

export default function CaseMembers() {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-sm space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Team access</p>
        <h2 className="text-2xl font-semibold text-slate-900 mt-2">Share this workspace</h2>
        <p className="text-sm text-slate-500 mt-2">
          Invite partners, associates, or outside counsel. Role-based permissions and timeline
          visibility controls are shipping next.
        </p>
      </header>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        Invitations are currently handled by the case owner. Soon you’ll be able to add members,
        assign roles, and monitor activity here.
      </div>
    </div>
  );
}
