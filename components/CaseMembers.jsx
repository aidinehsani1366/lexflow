"use client";

export default function CaseMembers() {
  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-4">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">Team & access</h2>
        <p className="text-sm text-slate-500">
          Invite partners, associates, or paralegals to collaborate on this case. Role-based access controls are coming next.
        </p>
      </header>
      <div className="rounded-lg border border-dashed p-6 text-center text-slate-500">
        Invitation workflow will live here. For now, only the case owner can see this workspace.
      </div>
    </div>
  );
}
