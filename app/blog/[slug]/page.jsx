import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "../../../lib/blog";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: `${post.title} · LexFlow Blog`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      article: {
        publishedTime: post.publishedAt,
        authors: [post.author],
        tags: post.tags,
      },
    },
  };
}

export default function BlogPostPage({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <article className="mx-auto max-w-3xl px-6 py-14 space-y-8">
        <header className="space-y-3">
          <Link
            href="/blog"
            className="text-xs uppercase tracking-[0.3em] text-indigo-600 hover:text-indigo-800"
          >
            ← Back to blog
          </Link>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {new Date(post.publishedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            · {post.readingTimeMinutes} min read
          </p>
          <h1 className="text-4xl font-semibold text-slate-900">{post.title}</h1>
          <p className="text-sm text-slate-500">By {post.author}</p>
          {post.tags?.length ? (
            <ul className="flex flex-wrap gap-2 text-xs text-indigo-600">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-semibold"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </header>

        <div className="space-y-4 text-slate-700 leading-relaxed">
          {post.content
            .trim()
            .split("\n\n")
            .map((block, idx) => {
              const trimmed = block.trim();
              if (!trimmed) return null;
              if (trimmed.startsWith("## ")) {
                return <h2 key={idx}>{trimmed.replace(/^##\s+/, "")}</h2>;
              }
              if (trimmed.startsWith("```")) {
                const code = trimmed.replace(/```/g, "").trim();
                return (
                  <pre key={idx} className="rounded-xl bg-slate-900/90 p-4 text-sm text-slate-100">
                    {code}
                  </pre>
                );
              }
              if (trimmed.startsWith("- ")) {
                return (
                  <ul key={idx} className="list-disc pl-6">
                    {trimmed.split("\n").map((line, subIdx) => (
                      <li key={subIdx}>{line.replace(/^-+\s*/, "").trim()}</li>
                    ))}
                  </ul>
                );
              }
              if (trimmed.includes("\n- ")) {
                const [intro, ...rest] = trimmed.split("\n");
                return (
                  <div key={idx} className="space-y-3">
                    <p>{intro}</p>
                    <ul className="list-disc pl-6">
                      {rest.map((line, subIdx) => (
                        <li key={subIdx}>{line.replace(/^-+\s*/, "").trim()}</li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return <p key={idx}>{trimmed}</p>;
            })}
        </div>

        <footer className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 space-y-2">
          <p className="text-sm font-semibold text-indigo-900">Want more playbooks?</p>
          <p className="text-sm text-indigo-800">
            Subscribe to the LexFlow newsletter or start the 7-day trial to see AI briefings in
            action.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/#pricing"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              Start free trial
            </Link>
            <Link
              href="mailto:hello@lexflow.com"
              className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-white transition"
            >
              Book a walkthrough
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}
