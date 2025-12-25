"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import MessageBubble from "./MessageBubble";
import MessageContent from "./MessageContent";

const suggestionPrompts = [
  {
    label: "Summarize document",
    prompt: "Summarize this document and list the key takeaways for the team.",
  },
  {
    label: "Extract deadlines",
    prompt: "What deadlines or dates are mentioned in this document?",
  },
  {
    label: "List risks",
    prompt: "Identify potential risks or follow-up items referenced in this document.",
  },
];

export default function DocumentChatPanel({ document, caseId, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState(null);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  useEffect(() => {
    if (!document) return;
    const fetchSessions = async () => {
      setSessionsLoading(true);
      setSessionError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No auth token found");

        const res = await fetch(`/api/documents/${document.id}/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load sessions");
        const list = payload.data || [];
        setSessions(list);
        if (list.length && !selectedSessionId) {
          setSelectedSessionId(list[0].id);
        }
      } catch (err) {
        setSessionError(err.message);
      } finally {
        setSessionsLoading(false);
      }
    };
    fetchSessions();
  }, [document?.id]);

  useEffect(() => {
    if (!document || !selectedSessionId) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      setLoadingMessages(true);
      setMessageError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No auth token found");
        const res = await fetch(
          `/api/documents/${document.id}/messages?sessionId=${selectedSessionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load messages");
        setMessages(payload.data || []);
      } catch (err) {
        setMessageError(err.message);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [document?.id, selectedSessionId]);

  useEffect(() => {
    setDeletingMessageId(null);
  }, [selectedSessionId, document?.id]);

  const createSession = async () => {
    const title = window.prompt("Session title", `Discussion ${sessions.length + 1}`);
    if (!title) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");
      const res = await fetch(`/api/documents/${document.id}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to create session");
      const updated = [...sessions, payload.data];
      setSessions(updated);
      setSelectedSessionId(payload.data.id);
    } catch (err) {
      setSessionError(err.message);
    }
  };

  const sendMessage = async (content) => {
    if (!content || !selectedSessionId || !document) return;
    setSending(true);
    setMessageError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");
      const res = await fetch(
        `/api/documents/${document.id}/messages?sessionId=${selectedSessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to send message");
      setMessages(payload.data || []);
      setInput("");
    } catch (err) {
      setMessageError(err.message);
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

  const handleDeleteMessage = async (messageId) => {
    if (!document || !selectedSessionId || !messageId) return;
    if (!window.confirm("Delete this exchange from the document chat?")) return;
    setDeletingMessageId(messageId);
    setMessageError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(
        `/api/documents/${document.id}/messages?sessionId=${selectedSessionId}&messageId=${messageId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to delete message");
      setMessages(payload.data || []);
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!document) return;
    if (!window.confirm("Delete this chat session? Conversation history will be removed.")) {
      return;
    }
    setSessionError("");
    setMessageError("");
    setDeletingSessionId(sessionId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(
        `/api/documents/${document.id}/sessions?sessionId=${sessionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to delete session");

      const filtered = (sessions || []).filter((session) => session.id !== sessionId);
      setSessions(filtered);
      if (selectedSessionId === sessionId) {
        const nextSelected = filtered.length ? filtered[0].id : null;
        setSelectedSessionId(nextSelected);
        if (!nextSelected) {
          setMessages([]);
        }
      }
    } catch (err) {
      setSessionError(err.message);
    } finally {
      setDeletingSessionId(null);
    }
  };

  if (!document) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl lg:flex-row max-h-[90vh]">
        <aside className="w-full border-b border-slate-100 bg-slate-50 p-4 lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Chat sessions</p>
            <button
              onClick={createSession}
              className="text-xs uppercase tracking-wide text-indigo-600 hover:text-indigo-800"
            >
              New
            </button>
          </div>
          {sessionError && (
            <p className="mt-2 text-xs text-red-500">{sessionError}</p>
          )}
          <div className="mt-3 space-y-2">
            {sessionsLoading ? (
              <p className="text-xs text-slate-400">Loading…</p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-400">
                No sessions yet. Start one to chat with this document.
              </p>
            ) : (
              sessions.map((session) => {
                const isActive = selectedSessionId === session.id;
                return (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedSessionId(session.id)}
                      className="flex-1 text-left"
                    >
                      <span className="block font-semibold">{session.title}</span>
                      <span className="text-[11px] uppercase tracking-wide text-slate-400">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      disabled={deletingSessionId === session.id}
                      className={`ml-2 rounded-full border border-slate-200 px-2 py-1 text-xs ${
                        deletingSessionId === session.id
                          ? "cursor-wait text-slate-300 opacity-60"
                          : "text-slate-300 hover:bg-red-50 hover:text-red-600"
                      }`}
                      title="Delete session"
                    >
                      {deletingSessionId === session.id ? "…" : "✕"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex w-full flex-col bg-white lg:max-w-3xl">
          <header className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Document AI
              </p>
              <h3 className="text-lg font-semibold text-slate-900">{document.file_name}</h3>
              <p className="text-xs text-slate-400">
                Uploaded {new Date(document.created_at).toLocaleString()} · {document.document_type || "General"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              Close
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loadingMessages ? (
              <p className="text-sm text-slate-500">Loading conversation…</p>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                Ask a question about this document or use a quick suggestion below.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role === "assistant" ? "ai" : "user"}
                    timestamp={msg.created_at}
                    actions={
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        disabled={deletingMessageId === msg.id}
                        className={`text-xs font-semibold ${
                          deletingMessageId === msg.id
                            ? "text-slate-300"
                            : "text-red-500 hover:text-red-600"
                        }`}
                        title="Delete message"
                        type="button"
                      >
                        {deletingMessageId === msg.id ? "…" : "Delete"}
                      </button>
                    }
                  >
                    <MessageContent content={msg.content} />
                  </MessageBubble>
                ))}
              </div>
            )}
            {messageError && (
              <p className="mt-3 text-xs text-red-500">{messageError}</p>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <div className="mb-2 flex flex-wrap gap-2">
              {suggestionPrompts.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => handleSuggestion(suggestion.prompt)}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm hover:bg-indigo-50"
                  type="button"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <input
                className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder="e.g., What arguments are raised in section II?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !selectedSessionId}
                className="rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:-translate-y-0.5 transition disabled:opacity-60"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
