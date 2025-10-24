"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

const documentTypes = [
  "Pleading",
  "Discovery",
  "Correspondence",
  "Evidence",
  "Compliance",
  "Other",
];

export default function UploadDocument({ caseId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [checklist, setChecklist] = useState("");
  const [error, setError] = useState("");
  const [documentType, setDocumentType] = useState(documentTypes[0]);
  const [notes, setNotes] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    setFile(selected || null);
    setChecklist("");
    setError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!caseId) {
      setError("Missing case context.");
      return;
    }
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath,
          fileName: file.name,
          userId: user.id,
          caseId,
          documentType,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const { checklist } = await res.json();
      setChecklist(checklist);
      setFile(null);
      setNotes("");
      setDocumentType(documentTypes[0]);
      onUploaded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Upload a legal document</h3>
          <p className="text-sm text-slate-500">
            We’ll store it securely and extract a compliance checklist right away.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="mt-4 space-y-3">
        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-slate-600 border border-slate-200 rounded-2xl bg-white/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-600">
            Document type
            <select
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Notes (optional)
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              placeholder="Exhibits missing signature page"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={uploading || !caseId}
          className="w-full rounded-full bg-slate-900 text-white py-3 font-semibold hover:-translate-y-0.5 transition disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {file && (
        <div className="mt-4 text-sm text-slate-600">
          📄 <strong>{file.name}</strong> selected
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-2" role="alert">
          {error}
        </p>
      )}
      {checklist && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm whitespace-pre-line text-left">
          <h4 className="font-semibold mb-2">AI Compliance Checklist</h4>
          <p>{checklist}</p>
        </div>
      )}
    </div>
  );
}
