"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { createQueryClient } from "@/lib/query/client";
import { PreviewWishlistProvider } from "@/features/wishlist/preview-wishlist";
import { PreviewProfileProvider } from "@/features/profile/preview-profile";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <PreviewProfileProvider>
        <PreviewWishlistProvider>{children}</PreviewWishlistProvider>
      </PreviewProfileProvider>
    </QueryClientProvider>
  );
}
