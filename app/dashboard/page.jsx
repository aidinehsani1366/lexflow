"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AuthForm from "../../components/AuthForm";
import UploadDocument from "../../components/UploadDocument";
import UserMenu from "../../components/UserMenu";
import FileList from "../../components/FileList";


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
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-6">
        <h1 className="text-2xl font-bold">Login to Your Dashboard</h1>
        <AuthForm />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-10 space-y-6">
      <div className="flex justify-between w-full max-w-3xl items-center px-6">
        <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
        <UserMenu />
      </div>

      <div className="w-full max-w-3xl">
        <UploadDocument />
        <FileList />

      </div>
    </main>
  );
}
