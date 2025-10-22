"use client";
import React from "react";
import Link from "next/link";


export default function LexFlowLanding() {
  // Call our backend to create a Stripe Checkout session and redirect
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
      // Redirect browser to Stripe Checkout
      window.location.href = url;
    } catch (e) {
      console.error(e);
      alert("Network error creating checkout session.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <header className="max-w-6xl mx-auto p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-sky-400 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <div>
            <h1 className="text-lg font-semibold">LexFlow</h1>
            <p className="text-xs text-slate-500">AI case & compliance manager for small law firms</p>
          </div>
        </div>
        <nav className="space-x-4 text-sm">
          <Link href="#features" className="hover:underline">Features</Link>
          <Link href="#pricing" className="hover:underline">Pricing</Link>
          <Link href="#waitlist" className="hover:underline">Join Waitlist</Link>
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">Simplify deadlines, filings, and compliance — with AI</h2>
            <p className="mt-4 text-slate-600">LexFlow organizes case deadlines, auto-generates compliance checklists from your documents, and sends reliable reminders so small firms can focus on practicing law — not admin.</p>

            <div className="mt-6 flex gap-3">
              <a href="#waitlist" className="inline-block px-5 py-3 bg-indigo-600 text-white rounded-lg shadow">Join the waitlist</a>
              <a href="#features" className="inline-block px-5 py-3 border border-slate-200 rounded-lg">See features</a>
            </div>

            <div className="mt-6 text-sm text-slate-500">Early-bird benefit: free 3-month Team plan for the first 20 firms.</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="font-semibold text-lg">Join early access</h3>
            <p className="mt-2 text-sm text-slate-600">Get product updates, beta access, and priority onboarding.</p>

            <form id="waitlist" action="https://formspree.io/f/mgvnnnll" method="POST" className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-600">Full name</label>
                <input name="name" required className="mt-1 w-full rounded-md border p-2" placeholder="Jane Doe" />
              </div>
              <div>
                <label className="block text-xs text-slate-600">Firm name</label>
                <input name="firm" className="mt-1 w-full rounded-md border p-2" placeholder="Law Offices of..." />
              </div>
              <div>
                <label className="block text-xs text-slate-600">Work email</label>
                <input name="email" type="email" required className="mt-1 w-full rounded-md border p-2" placeholder="jane@firm.com" />
              </div>
              <div>
                <button type="submit" className="w-full mt-2 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md cursor-pointer hover:bg-indigo-700 transition">Get early access</button>
              </div>
              <input type="hidden" name="ref" value="product-launch" />
            </form>

            <div className="mt-3 text-xs text-slate-500">We respect your privacy. You may unsubscribe at any time.</div>
          </div>
        </section>

        <section id="features" className="py-10">
          <h3 className="text-2xl font-bold">Core features (MVP)</h3>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h4 className="font-semibold">Deadline & Calendar</h4>
              <p className="mt-2 text-sm text-slate-600">Centralized calendar with court-specific deadline templates and automatic reminders.</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h4 className="font-semibold">AI Compliance Checklists</h4>
              <p className="mt-2 text-sm text-slate-600">Upload pleadings and the AI extracts required filings, docs, and steps.</p>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h4 className="font-semibold">Role-based Access</h4>
              <p className="mt-2 text-sm text-slate-600">Permissioned views for partners, associates, and paralegals.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-10">
          <h3 className="text-2xl font-bold">Pricing</h3>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Starter Card */}
            <div
              onClick={() => handleCheckout("price_1SIJnOE2OBuEBsraH7hBg3bP")}
              role="button"
              tabIndex={0}
              className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg focus:outline-none"
            >
              <div className="text-sm text-slate-500">Starter</div>
              <div className="mt-2 text-3xl font-extrabold">$49<span className="text-base font-medium">/mo</span></div>
              <div className="mt-3 text-sm text-slate-600">Single user, deadlines, reminders</div>
              <ul className="mt-4 text-sm space-y-2">
                <li>Case deadlines</li>
                <li>Email reminders</li>
                <li>Basic AI summaries</li>
              </ul>
            </div>

            {/* Team Card */}
            <div
              onClick={() => handleCheckout("price_1SIK0JE2OBuEBsraQMNdGgtJ")}
              role="button"
              tabIndex={0}
              className="bg-white p-6 rounded-lg shadow ring-2 ring-indigo-100 cursor-pointer hover:shadow-lg focus:outline-none"
            >
              <div className="text-sm text-slate-500">Team</div>
              <div className="mt-2 text-3xl font-extrabold">$149<span className="text-base font-medium">/mo</span></div>
              <div className="mt-3 text-sm text-slate-600">Up to 10 users + AI checklists</div>
              <ul className="mt-4 text-sm space-y-2">
                <li>All Starter features</li>
                <li>AI compliance checklists</li>
                <li>Shared calendar + CSV export</li>
              </ul>
            </div>

            {/* Firm Card */}
            <div
              onClick={() => handleCheckout("price_1SIK0oE2OBuEBsraw7cKEY2G")}
              role="button"
              tabIndex={0}
              className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg focus:outline-none"
            >
              <div className="text-sm text-slate-500">Firm</div>
              <div className="mt-2 text-3xl font-extrabold">$399<span className="text-base font-medium">/mo</span></div>
              <div className="mt-3 text-sm text-slate-600">Unlimited users + enterprise support</div>
              <ul className="mt-4 text-sm space-y-2">
                <li>SSO + advanced permissions</li>
                <li>Priority support</li>
                <li>Custom onboarding</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="py-8 text-center text-sm text-slate-500">
          © 2025 LexFlow. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
