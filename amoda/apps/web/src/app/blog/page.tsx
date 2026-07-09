import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { serverFetch } from "@/lib/server-fetch";
import type { PaginatedResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Blog", description: "Real estate insights, market trends, and AMODA news." };

interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
}

export default async function BlogIndexPage() {
  const result = await serverFetch<PaginatedResponse<BlogPostSummary>>("/blog").catch(
    () => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 1 } }) as PaginatedResponse<BlogPostSummary>,
  );

  return (
    <div className="container-page py-16">
      <h1 className="text-4xl font-bold">AMODA Blog</h1>
      <p className="mt-2 text-muted-foreground">Market insights, buying guides, and platform updates.</p>

      {result.data.length === 0 ? (
        <p className="mt-12 text-muted-foreground">No articles published yet — check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="pt-6">
                  <h2 className="line-clamp-2 text-lg font-semibold">{post.title}</h2>
                  {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>}
                  {post.publishedAt && (
                    <p className="mt-3 text-xs text-muted-foreground">{formatDate(post.publishedAt)}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
