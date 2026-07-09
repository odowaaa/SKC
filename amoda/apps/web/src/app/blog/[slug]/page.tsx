import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { serverFetch } from "@/lib/server-fetch";

interface BlogPostDetail {
  id: string;
  title: string;
  content: string;
  publishedAt?: string | null;
  author: { firstName: string; lastName: string };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await serverFetch<BlogPostDetail>(`/blog/${slug}`);
    return { title: post.title };
  } catch {
    return { title: "Post not found" };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  let post: BlogPostDetail;
  try {
    post = await serverFetch<BlogPostDetail>(`/blog/${slug}`);
  } catch {
    notFound();
  }

  return (
    <article className="container-page max-w-3xl py-16">
      <h1 className="text-4xl font-bold">{post.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        By {post.author.firstName} {post.author.lastName}
        {post.publishedAt && ` · ${formatDate(post.publishedAt)}`}
      </p>
      <div className="prose prose-slate mt-8 max-w-none whitespace-pre-line dark:prose-invert">{post.content}</div>
    </article>
  );
}
