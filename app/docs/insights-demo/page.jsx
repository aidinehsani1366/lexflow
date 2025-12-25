export const metadata = {
  title: "Lead Insights Demo",
  description:
    "Preview LexFlow's analytics workspace with sample conversion metrics, referral revenue, and lead sources.",
  alternates: {
    canonical: "/docs/insights-demo",
  },
  openGraph: {
    title: "LexFlow Analytics Demo",
    description:
      "Explore example dashboards that visualize lead sources, conversion funnels, and referral revenue—no login required.",
    url: "/docs/insights-demo",
  },
};

const DEMO_METRICS = {
  totals: {
    leads: 182,
    retained: 76,
    recent: 24,
    retentionRate: 41,
  },
  leadsBySource: [
    { label: "Partner · Redwood Legal", value: 52, delta: "+18%" },
    { label: "Direct · Website intake", value: 38, delta: "+7%" },
    { label: "Partner · Harbor Counsel", value: 29, delta: "+11%" },
    { label: "Email referral", value: 22, delta: "-4%" },
    { label: "Events / webinars", value: 11, delta: "+9%" },
  ],
  statusBreakdown: [
    { label: "Contacted", value: 41 },
    { label: "Consult scheduled", value: 28 },
    { label: "Retained", value: 76 },
    { label: "Lost", value: 37 },
  ],
  revenueByFirm: [
    { label: "Redwood Legal", value: 12450 },
    { label: "Northbridge LLP", value: 9300 },
    { label: "Harbor Counsel", value: 7125 },
    { label: "Stone & Bloom", value: 4850 },
  ],
  funnelNotes: [
    {
      title: "Partner conversions",
      insight:
        "Partner-tagged leads convert 2.3× faster this month. The Redwood widget accounted for 29% of retained matters.",
    },
    {
      title: "Idle leads",
      insight:
        "14 leads have been untouched for 3+ days. Assign follow-ups or trigger the automated nurture sequence.",
    },
    {
      title: "Revenue outlook",
      insight:
        "Scheduled consultations for March represent $42.5k in projected referral revenue. Two firms have pending payouts.",
    },
  ],
};

const formatCurrency = (value) =>
  Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const formatPercent = (value) => `${value}%`;

export default function InsightsDemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Product preview</p>
          <h1 className="text-3xl font-semibold">Lead & referral analytics demo</h1>
          <p className="text-sm text-slate-600">
            This sample dashboard mirrors what teams see inside LexFlow. Actual accounts pull live data from your
            intake forms, partner widgets, and referral fee ledger.
          </p>
        </header>

        <section className="space-y-6 rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm">
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em] text-slate-400">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">Demo data</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">Updated Mar 2025</span>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard label="Total leads" value={DEMO_METRICS.totals.leads} />
            <SummaryCard label="Retained matters" value={DEMO_METRICS.totals.retained} />
            <SummaryCard label="New this month" value={DEMO_METRICS.totals.recent} />
            <SummaryCard
              label="Retention rate"
              value={formatPercent(DEMO_METRICS.totals.retentionRate)}
              subtext="Partner + direct channels"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <BarListCard
              title="Top lead sources"
              subtitle="Current month vs. prior month performance"
              items={DEMO_METRICS.leadsBySource}
              valueFormatter={(item) => `${item.value} leads`}
            />
            <BarListCard
              title="Status distribution"
              subtitle="Across all active matters"
              items={DEMO_METRICS.statusBreakdown}
              valueFormatter={(item) => `${item.value}`}
              variant="neutral"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Referral revenue</h3>
              <p className="mt-1 text-base font-semibold text-slate-800">
                Paid + scheduled payouts over the last 90 days
              </p>
              <ul className="mt-4 space-y-3">
                {DEMO_METRICS.revenueByFirm.map((firm) => (
                  <li key={firm.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <span className="font-medium">{firm.label}</span>
                      <span className="font-semibold text-indigo-600">{formatCurrency(firm.value)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{
                          width: `${Math.min(100, (firm.value / DEMO_METRICS.revenueByFirm[0].value) * 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">Analyst notes</h3>
              <p className="text-sm text-slate-600">
                LexFlow’s AI surfaces emerging trends, idle leads, and revenue risks directly in the analytics view.
              </p>
              <ul className="space-y-3">
                {DEMO_METRICS.funnelNotes.map((note) => (
                  <li key={note.title} className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-indigo-500">{note.title}</p>
                    <p className="mt-1 text-sm text-indigo-900">{note.insight}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-indigo-900">Want to see your own data?</h2>
          <p className="text-sm text-indigo-800 mt-1">
            Connect your intake forms, enable partner widgets, and LexFlow will populate the same views with live
            metrics—no spreadsheets required.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Launch dashboard
            </a>
            <a
              href="/#pricing"
              className="rounded-full border border-indigo-200 px-5 py-2 text-sm font-semibold text-indigo-700 hover:bg-white transition"
            >
              Start the 7-day trial
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {subtext ? <p className="text-xs text-slate-500 mt-1">{subtext}</p> : null}
    </div>
  );
}

function BarListCard({ title, subtitle, items, valueFormatter, variant = "accent" }) {
  const maxValue = Math.max(...items.map((item) => item.value));
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-baseline justify-between text-sm text-slate-700">
              <span className="font-medium">{item.label}</span>
              <span className="font-semibold text-indigo-600">{valueFormatter(item)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${
                  variant === "accent" ? "bg-indigo-500" : "bg-slate-600"
                }`}
                style={{ width: `${Math.min(100, (item.value / maxValue) * 100)}%` }}
              />
            </div>
            {"delta" in item && item.delta ? (
              <p className="mt-1 text-xs text-slate-500">vs. last period {item.delta}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
