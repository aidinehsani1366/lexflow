import React from 'react'

// LexFlow Landing Page (single-file React component)
// Built for Next.js pages or Vercel deployments.
// Tailwind CSS assumed. Replace FORM_ACTION and MAIL_PLACEHOLDER with your services.

export default function LexFlowLanding() {
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
          <a href="#features" className="hover:underline">Features</a>
          <a href="#pricing" className="hover:underline">Pricing</a>
          <a href="#waitlist" className="hover:underline">Join Waitlist</a>
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
                <button type="submit" className="w-full mt-2 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md">Get early access</button>
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
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-slate-500">Starter</div>
              <div className="mt-2 text-3xl font-extrabold">$49<span className="text-base font-medium">/mo</span></div>
              <div className="mt-3 text-sm text-slate-600">Single user, deadlines, reminders</div>
              <ul className="mt-4 text-sm space-y-2">
                <li>Case deadlines</li>
                <li>Email reminders</li>
                <li>Basic AI summaries</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow ring-2 ring-indigo-100">
              <div className="text-sm text-slate-500">Team</div>
              <div className="mt-2 text-3xl font-extrabold">$149<span className="text-base font-medium">/mo</span></div>
              <div className="mt-3 text-sm text-slate-600">Up to 10 users + AI checklists</div>
              <ul className="mt-4 text-sm space-y-2">
                <li>All Starter features</li>
                <li>AI compliance checklists</li>
                <li>Shared calendar + CSV export</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
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

        <section className="py-10">
          <h3 className="text-2xl font-bold">What I built for you</h3>
          <p className="mt-3 text-slate-600">This repository includes:</p>
          <ul className="mt-3 list-disc list-inside text-sm text-slate-600">
            <li>Next.js + Tailwind landing page (this file) for waitlist capture</li>
            <li>README with deployment steps for Vercel/Netlify</li>
            <li>Starter backend outline (serverless API routes) and env var placeholders</li>
          </ul>

          <div className="mt-6 bg-white p-4 rounded-lg text-sm">
            <h4 className="font-semibold">Deployment notes</h4>
            <ol className="mt-2 list-decimal list-inside text-slate-600">
              <li>Install Tailwind in your Next.js app (official docs).</li>
              <li>Replace <code>FORM_ACTION</code> with Mailchimp / Formspree / Netlify forms endpoint.</li>
              <li>Set environment variables: <code>NEXT_PUBLIC_STRIPE_KEY</code>, <code>OPENAI_API_KEY</code>, <code>AUTH_DOMAIN</code>.</li>
              <li>Deploy to Vercel and connect domain (e.g., lexflowlegal.com).</li>
            </ol>
          </div>
        </section>

        <footer className="py-8 text-center text-sm text-slate-500">
          Built for a fast MVP. Questions? Reply in chat and tell me which next piece you want: backend scaffold, Stripe integration, or investor pitch deck.
        </footer>
      </main>
    </div>
  )
}

/* README snippet (paste into your project root README.md):

# LexFlow - Landing Page & Starter

This is a single-file landing page component intended for Next.js + Tailwind deployments.

Quick start:
1. Create a Next.js app: `npx create-next-app@latest lexflow`.
2. Install Tailwind (follow Tailwind + Next.js guide).
3. Replace pages/index.tsx (or pages/index.jsx) with this component content.
4. Replace `FORM_ACTION` in the form with your form provider endpoint (Formspree/Mailchimp/Netlify Forms).
5. Configure env vars in Vercel: `NEXT_PUBLIC_STRIPE_KEY`, `OPENAI_API_KEY`, `AUTH_DOMAIN`.
6. Deploy to Vercel: `vercel --prod`.

Backend TODOs:
- Add serverless API routes for waitlist handling, Stripe checkout sessions, and webhook verification.
- Minimal backend: Node.js/Express or Next.js API routes using Supabase/Postgres for storing leads.
- Integrate Clerk or Auth0 for authentication; use Stripe for billing.

*/
