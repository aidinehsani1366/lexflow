"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
import DashboardLayout from "../../../../components/DashboardLayout";
import CaseTabs from "../../../../components/CaseTabs";
import CaseOverview from "../../../../components/CaseOverview";
import CaseDocuments from "../../../../components/CaseDocuments";
import CaseChat from "../../../../components/CaseChat";
import CaseMembers from "../../../../components/CaseMembers";
import CaseCalendar from "../../../../components/CaseCalendar";
import CaseRecap from "../../../../components/CaseRecap";

export default function CaseWorkspace({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [caseData, setCaseData] = useState(null);
  const [caseLoading, setCaseLoading] = useState(true);
  const [caseError, setCaseError] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.replace("/dashboard");
        setLoadingUser(false);
        return;
      }
      setUser(data.user);
      setLoadingUser(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const fetchCase = async () => {
      setCaseLoading(true);
      setCaseError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No session token found");
        const res = await fetch(`/api/cases/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load case");
        setCaseData(payload.data);
      } catch (err) {
        console.error(err);
        setCaseError(err.message);
      } finally {
        setCaseLoading(false);
      }
    };
    fetchCase();
  }, [user, id]);

  const renderTab = () => {
    switch (activeTab) {
      case "documents":
        return <CaseDocuments caseId={caseData?.id} />;
      case "calendar":
        return <CaseCalendar caseId={caseData?.id} />;
      case "ai":
        return <CaseChat caseId={caseData?.id} />;
      case "recap":
        return <CaseRecap caseId={caseData?.id} />;
      case "members":
        return <CaseMembers caseId={caseData?.id} />;
      default:
        return <CaseOverview caseData={caseData} />;
    }
  };

  if (loadingUser) {
    return (
      <DashboardLayout>
        <p className="text-sm text-slate-500">Checking access...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {caseError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {caseError}{" "}
            <button
              onClick={() => router.push("/dashboard")}
              className="ml-2 underline"
            >
              Back to dashboard
            </button>
          </div>
        ) : (
          <>
            <CaseTabs active={activeTab} onChange={setActiveTab} />
            {caseLoading ? (
              <div className="rounded-xl bg-white p-6 shadow text-sm text-slate-500">
                Loading case workspace...
              </div>
            ) : (
              renderTab()
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
