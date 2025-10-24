"use client";
const tabs = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "ai", label: "AI Workspace" },
  { id: "members", label: "Members" },
];

export default function CaseTabs({ active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-t-md ${
            active === tab.id
              ? "bg-white text-indigo-600 border border-b-white border-slate-200"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
