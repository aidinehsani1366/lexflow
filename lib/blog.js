import { blogPosts } from "../content/blog/posts";

export function getAllPosts() {
  return blogPosts
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getPostBySlug(slug) {
  return blogPosts.find((post) => post.slug === slug) || null;
}
