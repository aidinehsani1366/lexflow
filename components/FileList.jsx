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

const formatBytes = (bytes) => {
  if (!bytes || Number.isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileList({ caseId, refreshToken = 0, onOpenChat }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    file_name: "",
    document_type: documentTypes[0],
    notes: "",
  });

  const getToken = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Authentication expired. Please sign in again.");
    return token;
  };

  const loadDocuments = async () => {
    if (!caseId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch(`/api/cases/${caseId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to load documents");
      setDocuments(payload.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, refreshToken]);

  const startEditing = (doc) => {
    setEditingId(doc.id);
    setFormData({
      file_name: doc.file_name || "",
      document_type: doc.document_type || documentTypes[0],
      notes: doc.notes || "",
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
      const token = await getToken();
      const res = await fetch(`/api/case-documents/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          file_name: formData.file_name,
          document_type: formData.document_type,
          notes: formData.notes,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Update failed");
      cancelEditing();
      loadDocuments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.file_name}"?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/case-documents/${doc.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Delete failed");
      if (editingId === doc.id) cancelEditing();
      loadDocuments();
    } catch (err) {
      alert(err.message);
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
        <h3 className="text-lg font-semibold text-slate-900">Case documents</h3>
        <p className="text-sm text-slate-500">
          View uploads and open them with AI once you’re ready to analyze.
        </p>
      </div>
      {documents.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500">
          <p className="text-lg">📂 No documents for this case yet</p>
          <p className="text-sm mt-1">Upload your first pleading to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col border border-white/70 bg-white/90 rounded-2xl px-4 py-3 shadow-sm hover:-translate-y-0.5 transition"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{doc.file_name}</p>
                  <p className="text-xs text-slate-400">
                    Uploaded {new Date(doc.created_at).toLocaleString()} · {formatBytes(doc.file_size)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Type: {doc.document_type || "General"}
                    {doc.notes ? ` · Notes: ${doc.notes}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onOpenChat?.(doc)}
                    className="text-xs uppercase tracking-wide text-indigo-600 hover:text-indigo-800"
                  >
                    Chat with AI
                  </button>
                  <button
                    onClick={() => startEditing(doc)}
                    className="text-xs uppercase tracking-wide text-slate-500 hover:text-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="text-xs uppercase tracking-wide text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingId === doc.id && (
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
                    placeholder="Optional notes"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelEditing}
                      className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold text-white hover:-translate-y-0.5"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
