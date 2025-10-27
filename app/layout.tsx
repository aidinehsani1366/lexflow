import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexflowlegal.com";
const defaultTitle = "LexFlowLegal – Legal Intake & Referral Revenue OS";
const defaultDescription =
  "LexFlowLegal is the secure legal intake and referral revenue workspace. Capture partner-ready leads, log consent and audit trails, and track payout obligations in one place.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | LexFlowLegal",
  },
  description: defaultDescription,
  keywords: [
    "legal intake software",
    "law firm referral tracking",
    "partner portal for attorneys",
    "client lead management",
    "referral fee automation",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: defaultTitle,
    description: defaultDescription,
    siteName: "LexFlowLegal",
    images: [
      {
        url: `${siteUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "LexFlowLegal legal intake and referral revenue platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    site: "@lexflowlegal",
    creator: "@lexflowlegal",
    images: [`${siteUrl}/og-image.svg`],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
  authors: [{ name: "LexFlowLegal" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LexFlowLegal",
    url: siteUrl,
    logo: `${siteUrl}/og-image.svg`,
    sameAs: [
      "https://www.linkedin.com/company/lexflowlegal/",
      "https://twitter.com/lexflowlegal",
    ],
    description: defaultDescription,
  };

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LexFlowLegal",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    },
    url: siteUrl,
    description: defaultDescription,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} bg-surface antialiased`}
      >
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        ) : null}
        <Script id="lexflow-org-ld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(organizationJsonLd)}
        </Script>
        <Script id="lexflow-product-ld" type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(productJsonLd)}
        </Script>
        {children}
      </body>
    </html>
  );
}
