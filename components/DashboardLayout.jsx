"use client";
import Link from "next/link";
import UserMenu from "./UserMenu";
import { usePlan } from "../lib/usePlan";
import { useProfile } from "../lib/useProfile";

const baseNavItems = [
  { label: "Cases", href: "/dashboard" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "Calendar", href: "/dashboard/calendar" },
  { label: "Insights", href: "/dashboard/insights" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Settings", href: "/dashboard/settings/roles" },
];

export default function DashboardLayout({ children }) {
  const { plan, loading } = usePlan();
  const { profile } = useProfile();

  const navItems = profile?.role === "admin"
    ? [...baseNavItems, { label: "Security", href: "/dashboard/security" }]
    : baseNavItems;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-100 bg-white px-6 py-8">
          <Link href="/" className="text-sm uppercase tracking-[0.4em] text-slate-400">
            LexFlow
          </Link>
          <p className="mt-2 text-lg font-semibold">Matter Control Center</p>
          <nav className="mt-8 space-y-1 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-50"
              >
                {item.label}
                {item.soon && (
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    Soon
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-slate-900 text-white px-4 py-5 space-y-2">
            <p className="text-sm font-semibold">Need a hand?</p>
            <p className="text-xs text-white/70">
              White-glove onboarding for every firm.
            </p>
            <Link href="mailto:hello@lexflow.com" className="text-sm underline">
              Contact support →
            </Link>
          </div>
        </aside>
        <div className="flex-1 flex flex-col">
          <header className="border-b border-slate-100 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-6 py-4 gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  LexFlow Dashboard
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  Orchestrate every matter
                </p>
              </div>
              <div className="flex items-center gap-3">
                {plan && !loading ? (
                  <Link
                    href="/dashboard/billing"
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
                  >
                    {plan.plan === "solo" && "Solo"}
                    {plan.plan === "team" && "Team"}
                    {plan.plan === "firm" && "Firm"}
                    {" "}plan
                  </Link>
                ) : (
                  <div className="h-8 w-24 rounded-full bg-slate-200 animate-pulse" />
                )}
                <UserMenu />
              </div>
            </div>
          </header>
          <main className="flex-1 px-6 py-8 bg-slate-50">{children}</main>
        </div>
      </div>
    </div>
  );
}
