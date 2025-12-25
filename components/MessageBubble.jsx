"use client";

const roleConfig = {
  ai: {
    icon: "AI",
    avatarClass: "bg-emerald-100 text-emerald-700",
    bubbleClass: "bg-slate-50 border-slate-200",
  },
  user: {
    icon: "You",
    avatarClass: "bg-slate-900 text-white",
    bubbleClass: "bg-white border-slate-200",
  },
  system: {
    icon: "!",
    avatarClass: "bg-indigo-100 text-indigo-600",
    bubbleClass: "bg-white border-indigo-100",
  },
};

export default function MessageBubble({ role = "ai", timestamp, actions, children }) {
  const config = roleConfig[role] || roleConfig.ai;
  const label = role === "ai" ? "LexFlow" : role === "user" ? "You" : "System";
  const formattedTime = timestamp
    ? `${label} · ${new Date(timestamp).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : label;
  return (
    <div className="flex items-start gap-3">
      <div
        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm ${config.avatarClass}`}
      >
        {config.icon}
      </div>
      <div
        className={`flex-1 rounded-2xl border px-5 py-4 shadow-sm transition-colors ${config.bubbleClass}`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{formattedTime}</p>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
