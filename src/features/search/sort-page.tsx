"use client";

import Link from "next/link";
import { usePreviewProfile } from "@/features/profile/preview-profile";
import {
  exploreSearch,
  sortOptions,
  type ExploreFilters,
} from "@/features/explore/demo-data";
import { JourneyLayout } from "@/features/tiktok/journey-layout";
import styles from "@/features/tiktok/journey.module.css";

export function SortPage({
  filters: initial,
  usePreferredCity,
}: {
  filters: ExploreFilters;
  usePreferredCity: boolean;
}) {
  const { profile } = usePreviewProfile();
  const filters = {
    ...initial,
    city: usePreferredCity ? profile.city : initial.city,
  };
  const search = exploreSearch(filters, profile.city !== "jakarta");
  return (
    <JourneyLayout
      title="Sort places"
      backHref={`/explore${search ? `?${search}` : ""}`}
      footer="Google Maps"
    >
      <h1>Find your order.</h1>
      {Object.entries(sortOptions).map(([value, label]) => {
        const selected = (filters.sort ?? "recommended") === value;
        const classes = `${styles.action} ${selected ? styles.yellow : ""}`;
        if (value === "nearest" && filters.city !== "jakarta")
          return (
            <button
              key={value}
              className={classes}
              disabled
              aria-describedby="sort-note"
            >
              {label}
            </button>
          );
        const next = exploreSearch(
          { ...filters, sort: value as keyof typeof sortOptions },
          profile.city !== "jakarta",
        );
        return (
          <Link
            key={value}
            href={`/explore?${next}`}
            className={classes}
            aria-current={selected ? "true" : undefined}
          >
            {label}
          </Link>
        );
      })}
      <p id="sort-note" className={`${styles.caption} ${styles.sortNote}`}>
        Rating dan jumlah ulasan mengikuti Google Maps. Nearest dihitung dari
        area Blok M.
      </p>
      {filters.city !== "jakarta" ? (
        <p role="status" className={styles.caption}>
          Nearest is unavailable without a known sample origin for this city.
          Highest Rated is used for a Nearest URL.
        </p>
      ) : null}
    </JourneyLayout>
  );
}
