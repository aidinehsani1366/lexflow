import Link from "next/link";

export const metadata = {
  title: "Partner Intake Widget Documentation",
  description:
    "Learn how to embed the LexFlowLegal partner intake widget, capture compliant leads, and route referral revenue in minutes.",
  alternates: {
    canonical: "/docs/partner-widget",
  },
  openGraph: {
    title: "LexFlowLegal Partner Intake Widget Docs",
    description:
      "Step-by-step instructions for installing the LexFlowLegal partner intake widget and logging consent-ready leads.",
    url: "/docs/partner-widget",
  },
};

export default function PartnerWidgetDocs() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Partner docs</p>
          <h1 className="text-3xl font-semibold">LexFlow partner intake widget</h1>
          <p className="text-sm text-slate-600">
            Embed LexFlow&rsquo;s secure intake form on referral firm websites. Every submission is
            tagged, consent-logged, and routed into your dashboard.
          </p>
        </header>

        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">1. Copy the script</h2>
          <p className="text-sm text-slate-600">
            From <Link href="/dashboard/settings/roles" className="text-indigo-600 underline">Settings → Team roles</Link>, copy
            the auto-generated snippet for the partner firm.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900/90 p-4 text-xs text-slate-100">
            {`<script async src="https://your-lexflow-domain.com/partner-intake.js"
  data-firm="{FIRM_ID}"
  data-partner-name="Partner Name"
  data-brand-color="#0f172a"
  data-height="640"></script>`}
          </pre>
          <ul className="list-disc space-y-1 pl-4 text-sm text-slate-600">
            <li>
              `data-firm` – required; ensures submissions are tagged to the referral firm.
            </li>
            <li>`data-partner-name` – optional; personalizes consent language.</li>
            <li>`data-brand-color` – optional hex color for the submit button.</li>
            <li>`data-height` – optional pixel height (defaults to 620px).</li>
            <li>`data-source` – optional custom source tag (e.g., `partner:redwood-site`).</li>
          </ul>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">2. Drop into the partner site</h2>
          <p className="text-sm text-slate-600">
            Paste the script wherever the partner wants the form to appear. The widget renders inline
            and inherits the width of its container.
          </p>
          <p className="text-sm text-slate-600">
            For CMS platforms (Webflow, Wix), use an embed element. For WordPress, add it to a custom
            HTML block.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">3. Test the intake</h2>
          <p className="text-sm text-slate-600">
            You can preview the widget without touching a partner site:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-slate-900/90 p-4 text-xs text-slate-100">
            {`https://your-lexflow-domain.com/widget/intake?firm={FIRM_ID}&partnerName=Partner%20Name`}
          </pre>
          <p className="text-sm text-slate-600">
            Submit a test lead—LexFlow records the consent text, IP address, and audit events on the
            lead detail page.
          </p>
        </section>

        <section className="space-y-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">FAQ</h2>
          <dl className="space-y-3 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-800">Can we add hidden metadata?</dt>
              <dd>
                Use `data-source` or extend the script by adding `data-metadata` with a JSON string. It
                will be merged into the lead&rsquo;s metadata payload.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800">Is the widget responsive?</dt>
              <dd>
                Yes. The iframe expands to 100% of its container. Adjust `data-height` if the host site
                needs more space.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-800">How does consent work?</dt>
              <dd>
                The widget enforces a consent checkbox. The consent text, timestamp, and IP are stored
                on the lead record and surfaced in the audit trail.
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
