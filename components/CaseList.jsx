"use client";
import { useState } from "react";
import Link from "next/link";
import CreateCaseModal from "./CreateCaseModal";

export default function CaseList({ cases = [], onCreate, creating = false, loading = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (title) => {
    if (!title?.trim()) return;
    await onCreate?.(title.trim());
    setIsModalOpen(false);
  };

  return (
    <section className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your cases</h2>
          <p className="text-sm text-slate-500">Create a workspace per matter to keep docs, chat, and teammates organized.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          New case
        </button>
      </div>

      {loading ? (
        <div className="mt-6 rounded-lg border border-slate-200 p-6 text-center text-slate-500">
          Loading cases...
        </div>
      ) : cases.length === 0 ? (
        <div className="mt-6 border border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500">
          <p className="font-medium">No cases yet</p>
          <p className="text-sm mt-1">Create your first case to start uploading documents.</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((caseItem) => (
            <li key={caseItem.id} className="border rounded-lg p-4 hover:shadow">
              <div className="text-sm uppercase tracking-wide text-slate-400">{caseItem.status || "Open"}</div>
              <h3 className="text-lg font-semibold mt-1">{caseItem.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {caseItem.created_at
                  ? `Created ${new Date(caseItem.created_at).toLocaleDateString()}`
                  : "Created just now"}
              </p>
              <Link
                href={`/dashboard/case/${caseItem.id}`}
                className="mt-4 inline-block text-indigo-600 text-sm hover:underline"
              >
                Open workspace →
              </Link>
            </li>
          ))}
        </ul>
      )}

      <CreateCaseModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        loading={creating}
      />
    </section>
  );
}
