"use client";

const tabs = [
  { id: "overview", label: "Overview", icon: "📋" },
  { id: "documents", label: "Documents", icon: "📁" },
  { id: "calendar", label: "Calendar", icon: "🗓️" },
  { id: "ai", label: "AI Workspace", icon: "✨" },
  { id: "members", label: "Members", icon: "👥" },
];

export default function CaseTabs({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 rounded-2xl border border-white/80 bg-white/80 p-2 shadow-sm">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-500 hover:bg-white hover:text-slate-800"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
