"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Scale } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toggleCompare } from "@/lib/api/interest";
import { useAuthStore } from "@/store/auth-store";

export function CompareButton({ propertyId }: { propertyId: string }) {
  const [isComparing, setIsComparing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () => toggleCompare(propertyId, isComparing),
    onSuccess: () => setIsComparing((prev) => !prev),
  });

  return (
    <Button
      variant={isComparing ? "accent" : "outline"}
      size="icon"
      aria-label="Add to compare"
      onClick={() => (user ? mutation.mutate() : router.push("/login"))}
      disabled={mutation.isPending}
    >
      <Scale className="h-4 w-4" />
    </Button>
  );
}
