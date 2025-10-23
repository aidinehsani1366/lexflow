"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function UploadDocument() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [checklist, setChecklist] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setChecklist("");
      setError("");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    setUploading(true);

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

      const text = await file.text();

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          fileName: file.name,
          userId: user.id,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      const { checklist } = await res.json();
      setChecklist(checklist);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md w-full max-w-md text-center">
      <h3 className="text-lg font-bold mb-4">Upload a Legal Document</h3>

      <form onSubmit={handleUpload} className="space-y-4">
        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-600 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
        />

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {file && (
        <div className="mt-4 text-sm text-gray-700">
          📄 <strong>{file.name}</strong> selected
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-2">❌ {error}</p>}
      {checklist && (
        <div className="mt-4 bg-slate-50 border rounded-md p-3 text-sm whitespace-pre-line text-left">
          <h4 className="font-semibold mb-2">AI Compliance Checklist:</h4>
          <p>{checklist}</p>
        </div>
      )}
    </div>
  );
}
