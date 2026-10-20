"use client";

import { createContext, useContext, useState } from "react";
import { parseTikTokUrl } from "@/features/tiktok/tiktok-url";
import { findDemoRestaurant } from "@/features/restaurants/demo-data";

const PreviewWishlist = createContext<{
  savedIds: string[];
  toggle: (id: string) => void;
  importDraft: { placeId: string; url: string };
  setImportDraft: (draft: { placeId: string; url: string }) => void;
  savedVideos: Record<string, string>;
  lastImport: string | null;
  previewSignedIn: boolean;
  signInPreview: () => void;
  saveRecommendation: () => void;
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
  const [importDraft, setImportDraft] = useState({
    placeId: "kedai-ramen-sore",
    url: "",
  });
  // shortcut: one link per restaurant per visit; use persisted collections when imports go live.
  const [savedVideos, setSavedVideos] = useState<Record<string, string>>({});
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [previewSignedIn, setPreviewSignedIn] = useState(false);
  function saveRecommendation() {
    const url = parseTikTokUrl(importDraft.url);
    if (!url || !findDemoRestaurant(importDraft.placeId)) return;
    setSavedIds((ids) =>
      ids.includes(importDraft.placeId) ? ids : [...ids, importDraft.placeId],
    );
    setSavedVideos((videos) => ({ ...videos, [importDraft.placeId]: url }));
    setLastImport(importDraft.placeId);
  }
  function toggle(id: string) {
    setSavedIds((ids) =>
      ids.includes(id) ? ids.filter((saved) => saved !== id) : [...ids, id],
    );
    if (savedIds.includes(id)) {
      setSavedVideos((videos) => {
        const next = { ...videos };
        delete next[id];
        return next;
      });
      if (lastImport === id) setLastImport(null);
    }
  }
  return (
    <PreviewWishlist
      value={{
        savedIds,
        toggle,
        importDraft,
        setImportDraft,
        savedVideos,
        lastImport,
        previewSignedIn,
        signInPreview: () => setPreviewSignedIn(true),
        saveRecommendation,
      }}
    >
      {children}
    </PreviewWishlist>
  );
}

export function usePreviewWishlist() {
  const context = useContext(PreviewWishlist);
  if (!context) throw new Error("PreviewWishlistProvider is required");
  return context;
}
