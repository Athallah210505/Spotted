"use client";

import { DetailIcon } from "@/features/restaurants/detail-icon";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "@/features/restaurants/restaurant-detail.module.css";
import { usePreviewWishlist } from "./preview-wishlist";

export function DetailSaveButton({
  id,
  name,
  savedHref,
  compact = false,
  redirectOnSave = true,
}: {
  id: string;
  name: string;
  savedHref: string;
  compact?: boolean;
  redirectOnSave?: boolean;
}) {
  const router = useRouter();
  const { savedIds, toggle } = usePreviewWishlist();
  const saved = savedIds.includes(id);
  return (
    <button
      className={compact ? styles.heroSave : `${styles.action} ${styles.save}`}
      onClick={() => {
        toggle(id);
        if (!saved && redirectOnSave) router.push(savedHref);
      }}
      aria-pressed={saved}
      aria-label={
        compact
          ? `${saved ? "Unsave" : "Bookmark"} ${name}`
          : `${saved ? "Remove" : "Save"} ${name}${saved ? " from" : " to"} wishlist`
      }
    >
      {compact ? (
        <Image
          src="/figma/editorial/bookmark.svg"
          width={22}
          height={22}
          alt=""
        />
      ) : (
        <>
          <DetailIcon name="bookmark" />
          <span>{saved ? "Saved" : "Save"}</span>
        </>
      )}
    </button>
  );
}
