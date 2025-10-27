"use client";
import { Fragment, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { usePlan } from "../lib/usePlan";

const promptSuggestions = [
  {
    label: "Summarize latest activity",
    prompt: "Summarize the most recent filings and note any open questions for the team.",
  },
  {
    label: "Ask about deadlines",
    prompt: "Review upcoming deadlines for this case and highlight any we might be missing.",
  },
  {
    label: "Outline next steps",
    prompt: "Given the current posture of this matter, outline recommended next steps and owners.",
  },
];

export default function CaseChat({ caseId }) {
  const { plan } = usePlan();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [deletingMessageId, setDeletingMessageId] = useState(null);

  useEffect(() => {
    setSessions([]);
    setSelectedSessionId(null);
  }, [caseId]);

  useEffect(() => {
    if (!caseId) return;
    const fetchSessions = async () => {
      setSessionsLoading(true);
      setSessionError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No auth token found");

        const res = await fetch(`/api/cases/${caseId}/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || "Failed to load sessions");
        const list = payload.data || [];
        setSessions(list);
        if (!selectedSessionId && list.length) {
          setSelectedSessionId(list[0].id);
        }
      } catch (err) {
        setSessionError(err.message);
      } finally {
        setSessionsLoading(false);
      }
    };
    fetchSessions();
  }, [caseId]);

  useEffect(() => {
    if (!caseId || !selectedSessionId) return;
    const fetchMessages = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("No auth token found");

        const res = await fetch(
          `/api/cases/${caseId}/messages?sessionId=${selectedSessionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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
  }, [caseId, selectedSessionId]);

  useEffect(() => {
    setDeletingMessageId(null);
  }, [selectedSessionId, caseId]);

  const sendMessage = async (content) => {
    if (!content || !caseId || !selectedSessionId) return;
    setSending(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(
        `/api/cases/${caseId}/messages?sessionId=${selectedSessionId}`,
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

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createSession = async () => {
    const defaultTitle = `Session ${sessions.length + 1}`;
    const title = window.prompt("Session title", defaultTitle);
    if (!title) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(`/api/cases/${caseId}/sessions`, {
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

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Delete this session? Chat history will be removed.")) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(`/api/cases/${caseId}/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to delete session");
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      if (selectedSessionId === sessionId) {
        setSelectedSessionId((prev) => {
          const remaining = sessions.filter((session) => session.id !== sessionId);
          return remaining.length ? remaining[0].id : null;
        });
      }
    } catch (err) {
      setSessionError(err.message);
    }
  };

  const togglePin = (message) => {
    setPinnedMessages((prev) => {
      const exists = prev.find((item) => item.id === message.id);
      if (exists) {
        return prev.filter((item) => item.id !== message.id);
      }
      return [...prev, message];
    });
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || !caseId || !selectedSessionId) return;
    if (!window.confirm("Delete this message from the chat history?")) return;
    setDeletingMessageId(messageId);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("No auth token found");

      const res = await fetch(
        `/api/cases/${caseId}/messages?sessionId=${selectedSessionId}&messageId=${messageId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to delete message");
      const updatedMessages = payload.data || [];
      setMessages(updatedMessages);
      setPinnedMessages((prev) =>
        prev.filter((item) => updatedMessages.some((msg) => msg.id === item.id))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const renderContent = (content) => {
    const lines = content.split(/\r?\n/);
    const nodes = [];
    let paragraph = [];
    let list = [];

    const pushParagraph = () => {
      if (paragraph.length) {
        nodes.push({ type: "p", text: paragraph.join(" ") });
        paragraph = [];
      }
    };

    const pushList = () => {
      if (list.length) {
        nodes.push({ type: "ul", items: list.slice() });
        list = [];
      }
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        pushParagraph();
        pushList();
        return;
      }
      const bullet = line.match(/^[-*]\s+(.*)/);
      if (bullet) {
        pushParagraph();
        list.push(bullet[1]);
      } else {
        pushList();
        paragraph.push(line);
      }
    });

    pushParagraph();
    pushList();

    return nodes.map((node, idx) => {
      if (node.type === "ul") {
        return (
          <ul key={`list-${idx}`} className="list-disc space-y-1 pl-5">
            {node.items.map((item, itemIdx) => (
              <li key={itemIdx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        );
      }
      return (
        <p key={`p-${idx}`} className="leading-relaxed">
          {node.text}
        </p>
      );
    });
  };

  if (!caseId) {
    return (
      <div className="rounded-3xl border border-white/80 bg-white/90 p-6 text-sm text-red-500">
        No case selected.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm lg:w-64">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Sessions</p>
          <button
            type="button"
            onClick={createSession}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            + New
          </button>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search sessions"
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        {sessionError && (
          <p className="mt-2 text-xs text-red-600">{sessionError}</p>
        )}
        <div className="mt-3 space-y-2 max-h-[24rem] overflow-y-auto">
          {sessionsLoading ? (
            <p className="text-xs text-slate-500">Loading sessions...</p>
          ) : filteredSessions.length === 0 ? (
            <p className="text-xs text-slate-500">No sessions yet.</p>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = selectedSessionId === session.id;
              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${
                    isSelected
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <button
                    onClick={() => setSelectedSessionId(session.id)}
                    className="flex-1 text-left"
                  >
                    <p className="font-semibold">{session.title}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="ml-2 rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-600"
                    title="Delete session"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <div className="flex-1 space-y-4 rounded-3xl border border-white/80 bg-white/90 p-6 shadow-sm">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-800">AI Workspace</h2>
          <p className="text-sm text-slate-500">
            Ask LexFlow about filings, deadlines, or track action items with your team. Citations appear like [Document#3].
          </p>
          {lastUpdated && (
            <p className="text-xs text-slate-400">
              Updated {" "}
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
              disabled={sending || !selectedSessionId}
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
            <p className="text-sm text-slate-500">No messages yet. Ask a strategy question or request a summary to get started.</p>
          ) : (
            messages.map((msg) => {
              const isAI = msg.sender === "ai";
              const isPinned = pinnedMessages.some((item) => item.id === msg.id);
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase text-slate-400 mb-1">
                        {isAI ? "LexFlow" : "You"} · {" "}
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => togglePin(msg)}
                          className={`text-xs ${isPinned ? "text-indigo-600" : "text-slate-400"}`}
                          title={isPinned ? "Unpin message" : "Pin message"}
                        >
                          {isPinned ? "★" : "☆"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          disabled={deletingMessageId === msg.id}
                          className={`text-xs font-semibold ${
                            deletingMessageId === msg.id
                              ? "text-slate-300"
                              : "text-red-500 hover:text-red-600"
                          }`}
                          title="Delete message"
                        >
                          {deletingMessageId === msg.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 text-slate-700">
                      {renderContent(msg.content).map((node, idx) => (
                        <Fragment key={idx}>{node}</Fragment>
                      ))}
                    </div>
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
          placeholder="e.g., What should we prepare before the status conference?"
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            disabled={!selectedSessionId}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">Case ID: {caseId}</p>
            <button
              type="submit"
              disabled={sending || !selectedSessionId}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {sending ? "Thinking..." : "Ask AI"}
            </button>
          </div>
        </form>

        {pinnedMessages.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">Pinned insights</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              {pinnedMessages.map((msg) => (
                <li key={msg.id}>
                  <span className="text-indigo-500 mr-2">★</span>
                  {msg.content}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
