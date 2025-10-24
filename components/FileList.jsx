"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function FileList({ caseId, refreshToken = 0 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadChecklists = async () => {
    if (!caseId) {
      setError("Missing case context.");
      setRows([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { data, error } = await supabase
        .from("checklists")
        .select("*")
        .eq("user_id", user.id)
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, refreshToken]);

  const handleDelete = async (row) => {
    if (!confirm(`Delete "${row.file_name}"?`)) return;

    try {
      const { error: dbError } = await supabase
        .from("checklists")
        .delete()
        .eq("id", row.id);

      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([`${row.user_id}/${row.file_name}`]);

      if (storageError) throw storageError;

      loadChecklists();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 w-40 rounded-full bg-slate-200 animate-pulse" />
        <div className="space-y-2">
          {[0, 1].map((key) => (
            <div key={key} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Analyzed documents</h3>
        <p className="text-sm text-slate-500">
          LexFlow stores AI checklists alongside each uploaded pleading.
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500">
          <p className="text-lg">📂 No documents for this case yet</p>
          <p className="text-sm mt-1">Upload your first pleading to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col border border-white/70 bg-white/90 rounded-2xl px-4 py-3 shadow-sm hover:-translate-y-0.5 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-800">{row.file_name}</p>
                  <p className="text-xs text-slate-400">
                    Uploaded {new Date(row.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(row)}
                  className="text-xs uppercase tracking-wide text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
              <div className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                {row.checklist}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
