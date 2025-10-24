"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const documentTypes = [
  "Pleading",
  "Discovery",
  "Correspondence",
  "Evidence",
  "Compliance",
  "Other",
];

export default function FileList({ caseId, refreshToken = 0 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    file_name: "",
    document_type: documentTypes[0],
    notes: "",
  });

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

  const startEditing = (row) => {
    setEditingId(row.id);
    setFormData({
      file_name: row.file_name || "",
      document_type: row.document_type || documentTypes[0],
      notes: row.notes || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({
      file_name: "",
      document_type: documentTypes[0],
      notes: "",
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    try {
      const { error: updateError } = await supabase
        .from("checklists")
        .update({
          file_name: formData.file_name.trim() || "Untitled document",
          document_type: formData.document_type,
          notes: formData.notes || null,
        })
        .eq("id", editingId);

      if (updateError) throw updateError;
      cancelEditing();
      loadChecklists();
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEditing(row)}
                    className="text-xs uppercase tracking-wide text-slate-500 hover:text-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(row)}
                    className="text-xs uppercase tracking-wide text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 font-semibold">
                  {row.document_type || "General"}
                </span>
                <span>
                  Notes: {row.notes ? row.notes : "—"}
                </span>
              </div>
              {editingId === row.id ? (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={formData.file_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, file_name: e.target.value }))
                    }
                    placeholder="Document name"
                  />
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    value={formData.document_type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, document_type: e.target.value }))
                    }
                  >
                    {documentTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <textarea
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Notes"
                  />
                  <div className="flex justify-end gap-2 text-sm">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-full border border-slate-200 px-4 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="rounded-full bg-slate-900 px-4 py-1 text-white"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-600 space-y-1">
                  {row.checklist
                    ? row.checklist.split(/\n+/).map((line, idx) => (
                        <p key={idx}>• {line.trim()}</p>
                      ))
                    : "No checklist generated."}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
