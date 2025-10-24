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
          throw new Error("No session token found");
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

  const handleCreateCase = async (title) => {
    setCreating(true);
    setCasesError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No session token found");

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
    // 👇 wrap login screen in DashboardLayout too
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center space-y-6 py-10">
          <h1 className="text-2xl font-bold">Login to Your Dashboard</h1>
          <AuthForm />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-3">
        {casesError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {casesError}
          </div>
        )}
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
