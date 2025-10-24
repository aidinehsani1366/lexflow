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
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1">
        <span className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
          {user.email?.charAt(0)?.toUpperCase() || "L"}
        </span>
        <p className="text-sm text-slate-600">{user.email}</p>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
      >
        Logout
      </button>
    </div>
  );
}
