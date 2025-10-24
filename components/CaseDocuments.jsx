"use client";
import { useEffect, useState } from "react";
import UploadDocument from "./UploadDocument";
import FileList from "./FileList";

export default function CaseDocuments({ caseId }) {
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    setRefreshToken(0);
  }, [caseId]);

  if (!caseId) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500">
        Select a case to start uploading documents.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Documents</h2>
        <p className="text-sm text-slate-500 mt-2">
          Keep pleadings, discovery, and correspondence scoped to this workspace. Uploads sync
          to Supabase storage and generate AI checklists instantly.
        </p>
      </div>
      <UploadDocument
        caseId={caseId}
        onUploaded={() => setRefreshToken((prev) => prev + 1)}
      />
      <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm">
        <FileList caseId={caseId} refreshToken={refreshToken} />
      </div>
    </div>
  );
}
