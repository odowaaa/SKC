"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toggleFavorite } from "@/lib/api/properties";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "next/navigation";

export function FavoriteButton({ propertyId }: { propertyId: string }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () => toggleFavorite(propertyId, isFavorited),
    onSuccess: () => setIsFavorited((prev) => !prev),
  });

  return (
    <Button
      variant={isFavorited ? "accent" : "outline"}
      size="icon"
      aria-label="Save to favorites"
      onClick={() => (user ? mutation.mutate() : router.push("/login"))}
      disabled={mutation.isPending}
    >
      <Heart className={isFavorited ? "h-4 w-4 fill-current" : "h-4 w-4"} />
    </Button>
  );
}
