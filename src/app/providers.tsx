"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { createQueryClient } from "@/lib/query/client";
import { PreviewWishlistProvider } from "@/features/wishlist/preview-wishlist";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <PreviewWishlistProvider>{children}</PreviewWishlistProvider>
    </QueryClientProvider>
  );
}
