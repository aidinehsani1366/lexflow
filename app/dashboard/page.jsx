"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import AuthForm from "../../components/AuthForm";
import DashboardLayout from "../../components/DashboardLayout";
import CaseList from "../../components/CaseList";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [creating, setCreating] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState("");
  const [metrics, setMetrics] = useState({
    activeCases: 0,
    docsThisWeek: 0,
    aiPromptsThisWeek: 0,
  });
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState("");

  useEffect(() => {
    // Check if a user session exists
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setLoading(false);
    };

    getUser();

    // Listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    // Cleanup
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchCases = async () => {
      setCasesLoading(true);
      setCasesError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setCases([]);
          setCasesError("");
          setCasesLoading(false);
          return;
        }
        const res = await fetch("/api/cases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load cases");
        setCases(payload.data || []);
      } catch (err) {
        console.error(err);
        setCasesError(err.message);
      } finally {
        setCasesLoading(false);
      }
    };
    fetchCases();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchMetrics = async () => {
      setMetricsLoading(true);
      setMetricsError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setMetrics({
            activeCases: 0,
            docsThisWeek: 0,
            aiPromptsThisWeek: 0,
          });
          setMetricsLoading(false);
          return;
        }
        const res = await fetch("/api/dashboard/metrics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load metrics");
        setMetrics(payload.data || {});
      } catch (err) {
        console.error(err);
        setMetricsError(err.message);
      } finally {
        setMetricsLoading(false);
      }
    };
    fetchMetrics();
  }, [user, cases.length]);

  const handleCreateCase = async (title) => {
    setCreating(true);
    setCasesError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setCasesError("Please sign in again to create a case.");
        return;
      }

      const res = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to create case");
      const newCase = payload.data;
      setCases((prev) => [newCase, ...prev]);
      router.push(`/dashboard/case/${newCase.id}`);
    } catch (err) {
      console.error(err);
      setCasesError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500 mt-10">Loading...</p>;
  }

  if (!user) {
    return (
      <div className="min-h-screen grid lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-slate-900 text-white p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              LexFlow Case OS
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Every matter, checklist, and chat in one elegant workspace.
            </h1>
            <p className="mt-6 text-white/70">
              Secure by design. Built for boutique firms that want clarity across
              litigation, compliance, and advisory work.
            </p>
          </div>
          <div className="space-y-2 text-sm text-white/60">
            <p>“Our team runs every discovery motion through LexFlow.”</p>
            <p>— Priya Menon, Managing Partner</p>
          </div>
        </div>
        <div className="flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-6 py-16">
          <AuthForm />
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {casesError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {casesError}
          </div>
        )}
        {metricsError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Metrics unavailable: {metricsError}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Active cases", value: metrics.activeCases || 0 },
            { label: "Docs analyzed this week", value: metrics.docsThisWeek || 0 },
            { label: "AI prompts sent", value: metrics.aiPromptsThisWeek || 0 },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                {item.label}
              </p>
              {metricsLoading ? (
                <div className="mt-3 h-6 w-16 rounded-full bg-slate-200 animate-pulse" />
              ) : (
                <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
              )}
            </div>
          ))}
        </div>
        <CaseList
          cases={cases}
          onCreate={handleCreateCase}
          creating={creating}
          loading={casesLoading}
        />
      </div>
    </DashboardLayout>
  );
}
