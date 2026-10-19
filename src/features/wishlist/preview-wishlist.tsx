"use client";

import { createContext, useContext, useState } from "react";

const PreviewWishlist = createContext<{
  savedIds: string[];
  toggle: (id: string) => void;
} | null>(null);

export function PreviewWishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [savedIds, setSavedIds] = useState([
    "kedai-ramen-sore",
    "kopi-halaman",
    "ruang-matcha",
  ]);
  function toggle(id: string) {
    setSavedIds((ids) =>
      ids.includes(id) ? ids.filter((saved) => saved !== id) : [...ids, id],
    );
  }
  return (
    <PreviewWishlist value={{ savedIds, toggle }}>{children}</PreviewWishlist>
  );
}

export function usePreviewWishlist() {
  const context = useContext(PreviewWishlist);
  if (!context) throw new Error("PreviewWishlistProvider is required");
  return context;
}
