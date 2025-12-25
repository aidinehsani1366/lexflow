import Link from "next/link";
import { getAllPosts } from "../../lib/blog";

export const metadata = {
  title: "LexFlow Blog",
  description:
    "Insights for modern law firms covering AI briefings, referral revenue, intake compliance, and more from the LexFlow team.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "LexFlow Blog",
    description:
      "Product updates and playbooks for firms automating case intake, document analysis, and partner revenue with LexFlow.",
    url: "/blog",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-14 space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">LexFlow blog</p>
          <h1 className="text-4xl font-semibold">Legal AI, intake, and partner ops insights</h1>
          <p className="text-base text-slate-600 max-w-2xl">
            Stay ahead of the curve with practical guides on AI briefings, referral fee automation,
            and the workflows that keep boutique firms competitive.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="flex h-full flex-col justify-between rounded-3xl border border-white/60 bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {new Date(post.publishedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">{post.title}</h2>
                <p className="text-sm text-slate-600">{post.description}</p>
              </div>
              <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                <span>
                  {post.readingTimeMinutes} min read · {post.author}
                </span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Read article →
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
