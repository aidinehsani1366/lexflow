"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";

const stats = [
  { label: "Cases orchestrated", value: "1.8k+" },
  { label: "Document chats powered", value: "9.4k+" },
  { label: "Audit events captured", value: "68k+" },
];

const features = [
  {
    title: "AI Briefing Hub",
    description:
      "Summon context-aware answers across every filing, deadline, and pinned insight in a single tab.",
  },
  {
    title: "Document-to-Action Chat",
    description:
      "Upload pleadings once—LexFlow indexes the text, cites excerpts, and lets you interrogate the doc instantly.",
  },
  {
    title: "Partner intake network",
    description:
      "Consent-backed forms, referral tracking, and revenue dashboards keep every partner relationship accountable.",
  },
];

const workflow = [
  "Launch a case workspace and invite collaborators.",
  "Upload discovery, motions, or briefs and open an instant doc chat.",
  "Ask the AI Briefing tab for deadlines, risks, and next steps across the matter.",
  "Share partner widgets, log referral fees, and keep the audit trail in sync.",
];

const testimonials = [
  {
    quote:
      "The AI Briefing tab is our morning stand-up. It cites filings, surfaces risks, and keeps partners aligned without digging through PDFs.",
    author: "Priya Menon, Managing Partner – Menon Law Group",
  },
  {
    quote:
      "LexFlow’s doc chat caught a missed deadline buried in ECF 92 and alerted the calendar instantly. That alone justified the rollout.",
    author: "Daniel Brown, Litigation Associate – KEG LLP",
  },
];

export default function LexFlowLanding() {
  const [leadForm, setLeadForm] = useState({
    contact_name: "",
    email: "",
    phone: "",
    case_type: "",
    jurisdiction: "",
    summary: "",
    consent: false,
  });
  const [leadMeta, setLeadMeta] = useState({ submitting: false, message: "" });
  const handleCheckout = async (plan: "solo" | "team" | "firm") => {
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        alert("Please sign in through the dashboard to manage billing.");
        window.location.href = "/dashboard";
        return;
      }
      if (!res.ok) {
        const err = await res.text();
        alert("Checkout failed: " + err);
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert("Network error creating checkout session.");
    }
  };

  const handleLeadSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!leadForm.consent) {
      setLeadMeta({
        submitting: false,
        message: "Please confirm consent so we can route your inquiry.",
      });
      return;
    }
    setLeadMeta({ submitting: true, message: "" });
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadForm,
          source: "landing",
          consent: leadForm.consent,
          consent_text:
            "I agree that LexFlow and partner law firms may contact me about my inquiry.",
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      setLeadForm({
        contact_name: "",
        email: "",
        phone: "",
        case_type: "",
        jurisdiction: "",
        summary: "",
        consent: false,
      });
      setLeadMeta({ submitting: false, message: "Thanks! A partner attorney will reach out shortly." });
    } catch (err) {
      setLeadMeta({
        submitting: false,
        message:
          err instanceof Error ? err.message : "Submission failed. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_50%),radial-gradient(circle_at_center,_rgba(14,165,233,0.15),_transparent_45%)]" />
        <header className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white font-bold text-xl flex items-center justify-center shadow-lg">
              L
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
                LexFlow
              </p>
              <p className="text-lg font-semibold">AI case & compliance OS</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-slate-600">
            <Link href="#features" className="hover:text-slate-900">
              Features
            </Link>
            <Link href="#workflow" className="hover:text-slate-900">
              Workflow
            </Link>
            <Link href="#pricing" className="hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/blog" className="hover:text-slate-900">
              Blog
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs tracking-wide"
            >
              Launch dashboard
            </Link>
          </nav>
        </header>

        <main className="max-w-6xl mx-auto px-6 pb-20">
          {/* Hero */}
          <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center py-10">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Trusted by boutique firms
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-slate-900">
                Run every matter from one AI briefing, document chat,{" "}
                <span className="text-transparent bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text">
                  and partner-ready workspace.
                </span>
              </h1>
              <p className="text-lg text-slate-600">
                LexFlow ingests your filings, calendars deadlines, and lets you interrogate
                documents in context. Stay compliant, keep partners in the loop, and turn every upload
                into actionable next steps.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#pricing"
                  className="px-6 py-3 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 transition"
                >
                  Start your free trial
                </a>
                <a
                  href="#pricing"
                  className="px-6 py-3 rounded-full border border-slate-200 text-slate-800 hover:bg-white transition"
                >
                  Compare plans
                </a>
                <a
                  href="/docs/insights-demo"
                  className="px-6 py-3 rounded-full border border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition"
                >
                  View analytics demo
                </a>
              </div>
              <p className="text-sm text-slate-500">
                Every new solo account includes a 7-day trial—upgrade in Stripe whenever you’re ready.
              </p>
            </div>
            <div className="glass-panel p-8 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-indigo-50 via-transparent to-sky-50 opacity-80" />
              <div className="relative space-y-4">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                  Live workspace preview
                </p>
                <div className="rounded-2xl bg-white p-4 shadow-inner">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      Acme vs. City of Riverton
                    </p>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      On track
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <span className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      File amended complaint + exhibits
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      Prep discovery responses for opposing counsel
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      Notify client of compliance steps + deadlines
                    </li>
                  </ul>
                </div>
                <div className="rounded-2xl bg-slate-900 p-5 text-white space-y-3 shadow-xl">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                    LexFlow AI
                    </p>
                    <p className="text-sm text-white/90">
                      “Document chat spotted three missing certifications and scheduled reminders.
                      I’ve tagged Priya so the client update goes out today.”
                    </p>
                </div>
              </div>
            </div>
        </section>

        <section id="intake" className="py-16 grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Need legal help?</p>
            <h2 className="text-3xl font-semibold text-slate-900">
              Tell LexFlow about your matter and we’ll route it to a vetted firm.
            </h2>
            <p className="text-slate-600">
              Describe your issue and we’ll connect you with the best-fit attorney from our network.
              Urgent matters are flagged for priority outreach.
            </p>
          </div>
          <form onSubmit={handleLeadSubmit} className="glass-panel p-8 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-[0.3em]">Full name</label>
                <input
                  required
                  value={leadForm.contact_name}
                  onChange={(e) =>
                    setLeadForm((prev) => ({ ...prev, contact_name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-[0.3em]">Email</label>
                <input
                  type="email"
                  required
                  value={leadForm.email}
                  onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-[0.3em]">Phone</label>
                <input
                  type="tel"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="(415) 555-1234"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-[0.3em]">
                  Jurisdiction
                </label>
                <input
                  value={leadForm.jurisdiction}
                  onChange={(e) => setLeadForm((prev) => ({ ...prev, jurisdiction: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="State or agency"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-[0.3em]">Case type</label>
              <input
                value={leadForm.case_type}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, case_type: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Employment, Personal injury, etc."
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-[0.3em]">Summary</label>
              <textarea
                required
                rows={4}
                value={leadForm.summary}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, summary: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Briefly describe your situation..."
              />
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/80 px-3 py-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={leadForm.consent}
                onChange={(e) =>
                  setLeadForm((prev) => ({
                    ...prev,
                    consent: e.target.checked,
                  }))
                }
                required
              />
              <span>
                I agree that LexFlow and partner law firms may contact me by phone or email about my
                inquiry. I understand my IP address and timestamp are logged for compliance.
              </span>
            </label>
            <p className="text-xs text-slate-500">
              Consent, timestamp, and IP are logged for attorney advertising compliance.
            </p>
            {leadMeta.message && (
              <p className="text-sm text-slate-600">{leadMeta.message}</p>
            )}
            <button
              type="submit"
              disabled={leadMeta.submitting || !leadForm.consent}
              className="w-full rounded-full bg-slate-900 py-3 font-semibold text-white hover:-translate-y-0.5 transition disabled:opacity-60"
            >
              {leadMeta.submitting ? "Submitting..." : "Send to LexFlow"}
            </button>
          </form>
        </section>

          {/* Stats */}
          <section className="grid gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="border border-white/60 bg-white/70 rounded-2xl p-6 shadow-sm text-center"
              >
                <p className="text-3xl font-semibold text-slate-900">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </section>

          {/* Features */}
          <section id="features" className="py-16 space-y-8">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Product pillars
              </p>
              <h2 className="text-3xl font-semibold text-slate-900 mt-3">
                AI-native matter management for litigation, compliance, and partner revenue.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm hover:-translate-y-1 transition"
                >
                  <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold mb-4">
                    {feature.title.charAt(0)}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Partner ops */}
          <section className="py-16 grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Partner network ops</p>
              <h2 className="text-3xl font-semibold text-slate-900">
                Give referral firms an embed-ready widget, audit trail, and revenue share ledger.
              </h2>
              <p className="text-slate-600">
                Drop a single script on any partner site to capture compliant intake. Every submission
                is auto-tagged, logged in the timeline, and tied to referral fees so payouts never
                slip.
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Embed-ready widget mirrors partner branding and enforces consent language.</li>
                <li>Lead history auto-records consent text, IP, and every assignment or status change.</li>
                <li>Referral fees track due dates, payouts, and revenue share per matter.</li>
              </ul>
              <a
                href="/docs/partner-widget"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                Preview partner widget →
              </a>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live audit trail</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-700">
                  <li>Intake submitted · partner: Redwood Legal</li>
                  <li>Status updated · contacted → retained · Priya Menon</li>
                  <li>Referral fee logged · $3,500 due Feb 15</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Insights snapshot</p>
                <p className="text-3xl font-semibold text-slate-900">72%</p>
                <p className="text-sm text-slate-500">retention for partner-tagged leads this month</p>
              </div>
            </div>
          </section>

          {/* Workflow */}
          <section
            id="workflow"
            className="py-16 grid gap-8 lg:grid-cols-2 items-center"
          >
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Workflow in seconds
              </p>
              <h2 className="text-3xl font-semibold">
                Upload a document. Receive context, tasks, and assignments.
              </h2>
              <p className="text-slate-600">
                LexFlow parses every pleading, cites relevant sections inside the chat, and updates
                calendars, reminders, and partner logs automatically. Invite teammates and keep every
                decision documented.
              </p>
            </div>
            <ol className="space-y-4">
              {workflow.map((step, index) => (
                <li
                  key={step}
                  className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm flex gap-4"
                >
                  <span className="text-lg font-semibold text-indigo-600">
                    0{index + 1}
                  </span>
                  <p className="text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Testimonials */}
          <section className="py-16 space-y-8">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Firms in the loop
              </p>
              <h2 className="text-3xl font-semibold">
                Lawyers trust LexFlow to stay proactive and client-ready.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {testimonials.map((item) => (
                <blockquote
                  key={item.author}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <p className="text-lg text-slate-800 leading-relaxed">
                    “{item.quote}”
                  </p>
                  <p className="text-sm text-slate-500 mt-4">{item.author}</p>
                </blockquote>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="py-16 space-y-8">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Pricing
              </p>
              <h2 className="text-3xl font-semibold">
                Flexible plans as you scale your matters.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              name: "Solo",
              price: "$49",
              plan: "solo" as const,
              description: "Independent lawyers managing a focused docket.",
              perks: ["7-day free trial", "Unlimited cases", "Document chat workspace"],
              cta: "Start free trial",
            },
            {
              name: "Team",
              price: "$149",
              highlight: true,
              plan: "team" as const,
              description: "Firms with partners, associates, and paralegals.",
              perks: [
                "Everything in Solo",
                "Collaborative AI Briefing & pinned insights",
                "Shared calendar exports & alerts",
              ],
            },
            {
              name: "Firm",
              price: "$399",
              plan: "firm" as const,
              description: "Full-service firms needing enterprise controls.",
              perks: ["SSO + granular roles", "Partner revenue ledger", "Dedicated CSM"],
            },
          ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl border p-6 shadow-sm flex flex-col gap-4 ${
                    plan.highlight
                      ? "border-indigo-200 bg-white"
                      : "border-slate-100 bg-white/90"
                  }`}
                >
                  <div>
                    <p className="text-sm text-slate-500 uppercase tracking-[0.25em]">
                      {plan.name}
                    </p>
                    <p className="mt-2 text-3xl font-semibold">
                      {plan.price}
                      <span className="text-base font-medium text-slate-500">
                        /month
                      </span>
                    </p>
                    <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                  </div>
                  <ul className="text-sm text-slate-700 space-y-2">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleCheckout(plan.plan)}
                    className={`mt-auto rounded-full px-5 py-3 text-sm font-semibold transition ${
                      plan.highlight
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "border border-slate-200 text-slate-800 hover:bg-white"
                    }`}
                  >
                    {plan.cta || "Choose plan"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Waitlist */}
          <section
            id="waitlist"
            className="py-16 grid gap-8 lg:grid-cols-2 items-center"
          >
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Early access
              </p>
              <h2 className="text-3xl font-semibold">
                Get launch updates, onboarding slots, and client success templates.
              </h2>
              <p className="text-slate-600">
                We’re rolling out LexFlow to a limited cohort to guarantee white-glove
                onboarding. Join the list and we’ll reach out within 48 hours.
              </p>
            </div>
            <form
              action="https://formspree.io/f/mgvnnnll"
              method="POST"
              className="glass-panel p-8 space-y-4"
            >
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-[0.3em]">
                  Full name
                </label>
                <input
                  name="name"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-[0.3em]">
                  Firm name
                </label>
                <input
                  name="firm"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Menon Law Group"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-[0.3em]">
                  Work email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="jane@firm.com"
                />
              </div>
              <input type="hidden" name="ref" value="landing-page" />
              <button
                type="submit"
                className="w-full rounded-full bg-slate-900 text-white py-3 font-semibold transition hover:-translate-y-0.5"
              >
                Request invite
              </button>
              <p className="text-xs text-slate-500">
                We keep communication respectful. Unsubscribe anytime.
              </p>
            </form>
          </section>

          <footer className="py-10 border-t border-white/50 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} LexFlowLegal. Purpose-built for modern firms.
          </footer>
        </main>
      </div>
    </div>
  );
}
