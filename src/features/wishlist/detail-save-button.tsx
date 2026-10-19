"use client";

import { DetailIcon } from "@/features/restaurants/detail-icon";
import styles from "@/features/restaurants/restaurant-detail.module.css";
import { usePreviewWishlist } from "./preview-wishlist";

export function DetailSaveButton({ id, name }: { id: string; name: string }) {
  const { savedIds, toggle } = usePreviewWishlist();
  const saved = savedIds.includes(id);
  return (
    <button
      className={`${styles.action} ${styles.save}`}
      onClick={() => toggle(id)}
      aria-pressed={saved}
      aria-label={`${saved ? "Remove" : "Save"} ${name}${saved ? " from" : " to"} wishlist`}
    >
      <DetailIcon name="bookmark" />
      <span>{saved ? "Saved" : "Save"}</span>
    </button>
  );
}
