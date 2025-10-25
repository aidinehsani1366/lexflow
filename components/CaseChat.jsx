"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePlan } from "../lib/usePlan";

const promptSuggestions = [
  {
    label: "Generate checklist",
    prompt: "Generate a compliance checklist based on the latest documents in this case.",
  },
  {
    label: "Summarize docs",
    prompt: "Summarize the most recent filings and highlight upcoming obligations.",
  },
  {
    label: "Flag risks",
    prompt: "List potential risks or missing filings we should address next.",
  },
];

export default function CaseChat({ caseId }) {
  const { plan } = usePlan();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

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
        setLastUpdated(new Date());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [caseId]);

  const sendMessage = async (content) => {
    if (!content || !caseId) return;
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
        body: JSON.stringify({ content }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to send message");
      setMessages(payload.data || []);
      setInput("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input.trim());
  };

  const handleSuggestion = (prompt) => {
    setInput(prompt);
    sendMessage(prompt);
  };

  if (!caseId) {
    return (
      <div className="rounded-3xl border border-white/80 bg-white/90 p-6 text-sm text-red-500">
        No case selected.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-sm space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-800">AI Workspace</h2>
        <p className="text-sm text-slate-500">
          Ask LexFlow about filings, deadlines, or track action items with your team.
        </p>
        {lastUpdated && (
          <p className="text-xs text-slate-400">
            Updated{" "}
            {lastUpdated.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {promptSuggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => handleSuggestion(suggestion.prompt)}
            disabled={sending}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
      {plan?.plan === "solo" && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-800">
          Solo plan includes limited AI prompts. Upgrade on the billing page for collaborative AI and higher limits.
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
              <div key={msg.id} className="flex gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isAI ? "bg-indigo-100 text-indigo-700" : "bg-slate-900 text-white"
                  }`}
                >
                  {isAI ? "AI" : "You"}
                </div>
                <div
                  className={`flex-1 rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${
                    isAI ? "bg-indigo-50" : "bg-white border"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
                    {isAI ? "LexFlow" : "You"} ·{" "}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-slate-700">{msg.content}</p>
                </div>
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
