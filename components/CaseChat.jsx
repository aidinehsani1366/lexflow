"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function CaseChat({ caseId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!caseId) return;
    const fetchMessages = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No auth token found");

        const res = await fetch(`/api/cases/${caseId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load messages");
        setMessages(payload.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [caseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !caseId) return;
    setSending(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(`/api/cases/${caseId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: input.trim() }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to send message");
      setMessages(payload.data || []);
      setInput("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!caseId) {
    return (
      <div className="p-6 bg-white rounded-xl shadow text-sm text-red-500">
        No case selected.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-sm space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-slate-800">AI Workspace</h2>
        <p className="text-sm text-slate-500">
          Ask LexFlow about filings, deadlines, or track action items with your team.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-slate-50 max-h-96 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-slate-500">Loading conversation...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet. Start by asking for a checklist.</p>
        ) : (
          messages.map((msg) => {
            const isAI = msg.sender === "ai";
            return (
              <div
                key={msg.id}
                className={`rounded-lg px-4 py-3 text-sm whitespace-pre-line ${
                  isAI ? "bg-indigo-50 ml-6" : "bg-white mr-6 border"
                }`}
              >
                <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
                  {isAI ? "LexFlow" : "You"} · {new Date(msg.created_at).toLocaleTimeString()}
                </p>
                <p className="text-slate-700">{msg.content}</p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Draft a checklist for opposing counsel's discovery request."
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-400">Case ID: {caseId}</p>
          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {sending ? "Thinking..." : "Ask AI"}
          </button>
        </div>
      </form>
    </div>
  );
}
