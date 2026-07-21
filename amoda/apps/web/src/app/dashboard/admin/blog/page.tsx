"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";

interface BlogPost {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

function NewPostForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiClient.post("/blog", { title, excerpt, content }),
    onSuccess: () => {
      setTitle("");
      setExcerpt("");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
    },
  });

  return (
    <Card className="mb-6">
      <CardContent className="space-y-3 pt-6">
        <h2 className="font-semibold">New post</h2>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Excerpt</Label>
          <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Content</Label>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          />
        </div>
        <Button disabled={!title || content.length < 20 || mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Creating..." : "Create draft"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminBlogPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["admin-blog"],
    queryFn: async () => (await apiClient.get("/blog/admin/all?limit=50")).data.data.data,
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/blog/${id}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/blog/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-blog"] }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Blog</h1>
      <NewPostForm />
      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      <div className="space-y-3">
        {data?.map((post) => (
          <Card key={post.id}>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div>
                <p className="font-semibold">{post.title}</p>
                <Badge variant={post.status === "PUBLISHED" ? "success" : "muted"}>{post.status}</Badge>
              </div>
              <div className="flex gap-2">
                {post.status !== "PUBLISHED" && (
                  <Button size="sm" onClick={() => publishMutation.mutate(post.id)}>
                    Publish
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(post.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
