"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function FileList() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");

      const { data, error } = await supabase.storage
        .from("documents")
        .list(user.id + "/", {
          limit: 20,
          sortBy: { column: "name", order: "asc" },
        });

      if (error) throw error;
      setFiles(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleDownload = async (fileName) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.storage
      .from("documents")
      .download(`${user.id}/${fileName}`);

    if (error) {
      alert("Download failed: " + error.message);
      return;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDelete = async (fileName) => {
    if (!confirm(`Delete "${fileName}"?`)) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.storage
        .from("documents")
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      loadFiles();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const getFileIcon = (name) => {
    if (name.endsWith(".pdf")) return "📄";
    if (name.endsWith(".doc") || name.endsWith(".docx")) return "📝";
    if (name.endsWith(".txt")) return "📃";
    return "📁";
  };

  if (loading) return <div className="text-sm text-slate-500">Loading files...</div>;
  if (error) return <div className="text-red-500 text-sm">Error: {error}</div>;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Your uploaded pleadings</h3>
      {files.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-md text-center text-slate-500">
          <p className="text-lg">📂 No documents uploaded yet</p>
          <p className="text-sm mt-1">Upload your first pleading to get started.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.name}
              className="flex justify-between items-center bg-white border rounded-md px-4 py-2 shadow-sm hover:shadow"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{getFileIcon(file.name)}</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{file.name}</p>
                  {file.metadata?.last_modified && (
                    <p className="text-xs text-slate-400">
                      Uploaded {new Date(file.metadata.last_modified).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-x-3">
                <button
                  onClick={() => handleDownload(file.name)}
                  className="text-indigo-600 hover:underline text-sm"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(file.name)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
