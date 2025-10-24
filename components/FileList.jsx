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

  if (loading) return <div className="text-sm text-slate-500">Loading documents...</div>;
  if (error) return <div className="text-red-500 text-sm">Error: {error}</div>;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Analyzed documents</h3>
      {rows.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-md text-center text-slate-500">
          <p className="text-lg">📂 No documents for this case yet</p>
          <p className="text-sm mt-1">Upload your first pleading to get started.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col bg-white border rounded-md px-4 py-3 shadow-sm hover:shadow"
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
                  className="text-red-600 hover:underline text-sm"
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
