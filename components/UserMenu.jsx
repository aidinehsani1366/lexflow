"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function UserMenu() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Check initial user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
    });

    // 2. Subscribe to login/logout changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    // 3. Cleanup on unmount
    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Logout failed: " + error.message);
      return;
    }
    // Redirect to dashboard login page
    window.location.href = "/dashboard";
  };  

  // 👇 Only render if user is signed in
  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      <p className="text-sm text-slate-600">👋 {user.email}</p>
      <button
        onClick={handleLogout}
        className="text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}
