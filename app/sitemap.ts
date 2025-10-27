import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexflowlegal.com";

const routes: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }> =
  [
    { path: "/", changeFrequency: "weekly" },
    { path: "/docs/partner-widget", changeFrequency: "monthly" },
  ];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map(({ path, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority: path === "/" ? 1 : 0.6,
  }));
}
