"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: sessionData } = await supabase.auth.getUser();
        const user = sessionData.user;
        if (!user) {
          setProfile(null);
          return;
        }
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, role, firm_id")
          .eq("id", user.id)
          .single();
        if (profileError) throw profileError;
        setProfile(data);
      } catch (err) {
        setError(err.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { profile, loading, error };
}
