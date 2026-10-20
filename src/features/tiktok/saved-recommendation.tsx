"use client";

import { useRef, useState } from "react";
import { PreviewDialog } from "@/components/ui/preview-dialog";
import { DetailIcon } from "@/features/restaurants/detail-icon";
import styles from "@/features/restaurants/restaurant-detail.module.css";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";

export function SavedRecommendation({ placeId }: { placeId: string }) {
  const { savedVideos } = usePreviewWishlist();
  const url = savedVideos[placeId];
  const [explaining, setExplaining] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  if (!url && placeId !== "kedai-ramen-sore")
    return (
      <p className={styles.supporting}>No saved video links in this preview.</p>
    );
  return (
    <>
      <article className={styles.video}>
        <DetailIcon name="video" />
        <h3>Saved food recommendation</h3>
        <p className={styles.supporting}>
          {url
            ? "Your link stays in this open app for this visit only."
            : "Only you can see this linked video."}
        </p>
        {url ? (
          <a
            className={styles.action}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DetailIcon name="external" />
            <span>Watch on TikTok</span>
          </a>
        ) : (
          <button
            className={styles.action}
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setExplaining(true);
            }}
          >
            <DetailIcon name="external" />
            <span>Watch on TikTok</span>
          </button>
        )}
      </article>
      {explaining ? (
        <PreviewDialog
          title="Video link unavailable"
          trigger={trigger}
          onClose={() => setExplaining(false)}
        >
          <p>
            This card is an illustrative saved link. No TikTok video is
            connected to this preview.
          </p>
        </PreviewDialog>
      ) : null}
    </>
  );
}
