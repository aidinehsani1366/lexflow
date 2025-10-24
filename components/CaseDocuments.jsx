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
      <div className="rounded-xl bg-white p-6 shadow text-sm text-red-500">
        No case selected.
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">Documents</h2>
        <p className="text-sm text-slate-500">
          Upload pleadings, evidence, or correspondence scoped to this case.
        </p>
      </header>
      <UploadDocument
        caseId={caseId}
        onUploaded={() => setRefreshToken((prev) => prev + 1)}
      />
      <FileList caseId={caseId} refreshToken={refreshToken} />
    </div>
  );
}
