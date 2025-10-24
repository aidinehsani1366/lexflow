"use client";
import { useState } from "react";
import Link from "next/link";
import CreateCaseModal from "./CreateCaseModal";

export default function CaseList({
  cases = [],
  onCreate,
  creating = false,
  loading = false,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmit = async (title) => {
    if (!title?.trim()) return;
    await onCreate?.(title.trim());
    setIsModalOpen(false);
  };

  const renderList = () => {
    if (loading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-white/70 bg-white/70 p-5 animate-pulse space-y-3"
            >
              <div className="h-3 w-20 rounded-full bg-slate-200" />
              <div className="h-4 w-32 rounded-full bg-slate-200" />
              <div className="h-3 w-24 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      );
    }

    if (cases.length === 0) {
      return (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No cases yet. Create your first workspace to start uploading documents.
        </div>
      );
    }

    return (
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((caseItem) => (
          <li
            key={caseItem.id}
            className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm hover:-translate-y-1 transition"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
              {caseItem.status || "Open"}
            </p>
            <h3 className="mt-2 text-lg font-semibold">{caseItem.title}</h3>
            <p className="text-xs text-slate-400 mt-1">
              {caseItem.created_at
                ? `Created ${new Date(caseItem.created_at).toLocaleDateString()}`
                : "Created just now"}
            </p>
            <Link
              href={`/dashboard/case/${caseItem.id}`}
              className="mt-6 inline-flex items-center text-sm font-semibold text-indigo-600"
            >
              Open workspace →
            </Link>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Workspace</p>
          <h2 className="text-2xl font-semibold">Case library</h2>
          <p className="text-sm text-slate-500">
            Each case keeps documents, AI threads, and collaboration scoped to one place.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition"
        >
          New case
        </button>
      </div>

      {renderList()}

      <CreateCaseModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        loading={creating}
      />
    </section>
  );
}
