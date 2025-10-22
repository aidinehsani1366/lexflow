"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AuthForm from "../../components/AuthForm";
import UploadDocument from "../../components/UploadDocument";
import UserMenu from "../../components/UserMenu";
import FileList from "../../components/FileList";
import DashboardLayout from "../../components/DashboardLayout"; // 👈 NEW import

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="space-y-6">
        {/* Upload card */}
        <div className="bg-white rounded-xl shadow p-6">
          <UploadDocument />
        </div>

        {/* File list card */}
        <div className="bg-white rounded-xl shadow p-6">
          <FileList />
        </div>
      </div>
    </DashboardLayout>
  );
}
