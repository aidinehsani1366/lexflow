"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function UserMenu() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Logout failed: " + error.message);
      return;
    }
    // Redirect to landing page
    window.location.href = "/";
  };

  if (!user) {
    return (
      <div className="p-4 bg-white rounded-md shadow text-slate-600">
        <p>👋 Welcome!</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-md shadow text-slate-600 flex justify-between items-center">
      <p>👋 {user.email}</p>
      <button
        onClick={handleLogout}
        className="text-sm bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
      >
        Logout
      </button>
    </div>
  );
}
