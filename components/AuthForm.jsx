"use client";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("You're in. Redirecting…");
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created. Check your inbox to confirm access.");
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/30 bg-white/80 p-8 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            LexFlow Portal
          </p>
          <h3 className="text-2xl font-semibold text-slate-900">
            {isLogin ? "Welcome back" : "Create your account"}
          </h3>
        </div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">
          Secure
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <label className="block text-sm text-slate-600">
          Work email
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            type="email"
            placeholder="you@firm.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm text-slate-600">
          Password
          <input
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-slate-900 py-3 text-white font-semibold transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? "Processing…" : isLogin ? "Enter dashboard" : "Create account"}
        </button>
      </form>

      <button
        className="mt-4 w-full text-sm text-indigo-600 hover:text-indigo-800"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "Need an account? Sign up" : "Have an account? Log in"}
      </button>

      {message && (
        <p className="mt-3 rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
          {message}
        </p>
      )}
    </div>
  );
}
