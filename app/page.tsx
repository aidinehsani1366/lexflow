"use client";
import Link from "next/link";

const stats = [
  { label: "Deadlines tracked", value: "32k+" },
  { label: "Docs analyzed", value: "11k+" },
  { label: "Avg. time saved / case", value: "6.2 hrs" },
];

const features = [
  {
    title: "Matter timeline",
    description:
      "Centralize pleadings, court dates, and reminders with jurisdiction-aware templates.",
  },
  {
    title: "AI compliance workspace",
    description:
      "Upload a brief and instantly receive checklists, risk flags, and follow-up prompts.",
  },
  {
    title: "Collaboration canvas",
    description:
      "Partners, associates, and paralegals work in one secure case profile with audit trails.",
  },
];

const workflow = [
  "Create a case workspace with one click.",
  "Upload discovery, motions, or correspondence.",
  "LexFlow extracts deadlines, filings, and next steps.",
  "Assign tasks, invite teammates, and keep chat history.",
];

const testimonials = [
  {
    quote:
      "LexFlow replaced three spreadsheets and a whiteboard. My team closes matters faster and nothing slips.",
    author: "Priya Menon, Managing Partner – Menon Law Group",
  },
  {
    quote:
      "We upload a PDF and the AI checklist is ready before the partner finishes coffee. It's now part of our intake process.",
    author: "Daniel Brown, Litigation Associate – KEG LLP",
  },
];

export default function LexFlowLanding() {
  const handleCheckout = async (priceId: string) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
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
                Orchestrate deadlines, filings, and client updates —{" "}
                <span className="text-transparent bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text">
                  all in one elegant workspace.
                </span>
              </h1>
              <p className="text-lg text-slate-600">
                LexFlow translates documents into action plans, keeps every case
                organized, and gives your team a modern control center for
                litigation, compliance, and advisory matters.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#waitlist"
                  className="px-6 py-3 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:-translate-y-0.5 transition"
                >
                  Join early access
                </a>
                <a
                  href="#pricing"
                  className="px-6 py-3 rounded-full border border-slate-200 text-slate-800 hover:bg-white transition"
                >
                  See pricing
                </a>
              </div>
              <p className="text-sm text-slate-500">
                Early partner benefit: 3 months of the Team plan, on us.
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
                      Prep discovery checklist for opposing counsel
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
                    “Discovery request references three missing certifications.
                    Add them to the compliance checklist and alert Priya.”
                  </p>
                </div>
              </div>
            </div>
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
                Built for boutique and mid-size firms that need clarity without
                enterprise bloat.
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
                LexFlow parses every pleading, discovers missing steps, and
                auto-builds the checklist you would expect from a senior
                associate. Invite teammates and keep every decision documented.
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
                  id: "price_1SIJnOE2OBuEBsraH7hBg3bP",
                  description: "Independent lawyers managing a focused docket.",
                  perks: ["Unlimited cases", "Deadline assistant", "AI summaries"],
                },
                {
                  name: "Team",
                  price: "$149",
                  highlight: true,
                  id: "price_1SIK0JE2OBuEBsraQMNdGgtJ",
                  description: "Firms with partners, associates, and paralegals.",
                  perks: [
                    "Everything in Solo",
                    "AI compliance checklists",
                    "Shared calendar + exports",
                  ],
                },
                {
                  name: "Firm",
                  price: "$399",
                  id: "price_1SIK0oE2OBuEBsraw7cKEY2G",
                  description: "Full-service firms needing enterprise controls.",
                  perks: ["SSO + granular roles", "Priority onboarding", "Dedicated CSM"],
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
                    onClick={() => handleCheckout(plan.id)}
                    className={`mt-auto rounded-full px-5 py-3 text-sm font-semibold transition ${
                      plan.highlight
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                        : "border border-slate-200 text-slate-800 hover:bg-white"
                    }`}
                  >
                    Choose plan
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
