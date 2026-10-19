"use client";

import Link from "next/link";
import { useState } from "react";
import { BrowseIcon } from "@/components/layout/browse-icon";
import { DetailIcon } from "@/features/restaurants/detail-icon";
import {
  categories,
  exploreSearch,
  filterDemoRestaurants,
  type ExploreFilters,
} from "@/features/explore/demo-data";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";
import { usePreviewProfile } from "@/features/profile/preview-profile";
import shared from "@/components/layout/browse.module.css";
import styles from "./filters.module.css";

export function FiltersPage({
  filters,
  from,
  usePreferredCity,
}: {
  filters: ExploreFilters;
  from: "explore" | "map";
  usePreferredCity: boolean;
}) {
  const { profile } = usePreviewProfile();
  const initial = {
    ...filters,
    city: usePreferredCity ? profile.city : filters.city,
    distance: filters.distance ?? profile.radius,
  };
  const [draft, setDraft] = useState<ExploreFilters>(initial);
  const { savedIds } = usePreviewWishlist();
  const count = filterDemoRestaurants(draft, savedIds).length;
  const search = exploreSearch(draft, profile.city !== "jakarta");
  const original = exploreSearch(
    filters,
    !usePreferredCity && filters.city === "jakarta",
  );
  const backHref = `/${from}${original ? `?${original}` : ""}`;
  function update(values: Partial<ExploreFilters>) {
    setDraft((current) => ({ ...current, ...values }));
  }
  return (
    <div className={shared.shell}>
      <a className={shared.skipLink} href="#filters-content">
        Skip to filters
      </a>
      <div className={shared.safeArea}>
        <Link
          href="/profile"
          className={shared.quickLocation}
          aria-label="Edit preferred city"
        >
          <BrowseIcon name="locate" size={16} />
        </Link>
      </div>
      <main className={shared.scrollArea} id="filters-content" tabIndex={-1}>
        <div className={styles.content}>
          <header className={styles.header}>
            <Link
              className={styles.back}
              href={backHref}
              aria-label={`Back to ${from === "map" ? "Map" : "Explore"}`}
            >
              <DetailIcon name="back" />
            </Link>
            <h1>Filter your cravings</h1>
          </header>
          <p className={styles.supporting} role="status">
            {count} matching {count === 1 ? "place" : "places"} · Illustrative
          </p>
          <fieldset>
            <legend>Cuisine</legend>
            <div className={shared.categoryRail}>
              {(
                [
                  "All",
                  "Japanese",
                  "Coffee",
                  "Korean",
                  ...categories.filter(
                    (value) =>
                      !["All", "Japanese", "Coffee", "Korean"].includes(value),
                  ),
                ] as const
              ).map((category) => (
                <button
                  key={category}
                  className={shared.category}
                  aria-pressed={draft.category === category}
                  onClick={() => update({ category })}
                >
                  {category}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Google rating</legend>
            <div className={shared.categoryRail}>
              {([undefined, 4, 4.5] as const).map((minRating) => (
                <button
                  key={minRating ?? "any"}
                  className={shared.category}
                  aria-pressed={draft.minRating === minRating}
                  onClick={() => update({ minRating })}
                >
                  {minRating ? `${minRating === 4 ? "4.0" : "4.5"}+` : "Any"}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Distance</legend>
            <div className={styles.distance}>
              {([1, 3, 5, 10] as const).map((distance) => (
                <button
                  key={distance}
                  aria-pressed={draft.distance === distance}
                  onClick={() => update({ distance })}
                >
                  {distance} km
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Price level</legend>
            <div className={shared.categoryRail}>
              {([undefined, 1, 2, 3] as const).map((price) => (
                <button
                  key={price ?? "any"}
                  className={shared.category}
                  aria-pressed={draft.price === price}
                  onClick={() => update({ price })}
                >
                  {price ? "Rp".repeat(price) : "Any"}
                </button>
              ))}
            </div>
          </fieldset>
          {(
            [
              ["openNow", "Open Now"],
              ["halalOnly", "Verified halal only"],
              ["savedOnly", "Saved Only"],
            ] as const
          ).map(([key, label]) => (
            <label className={styles.check} key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={Boolean(draft[key])}
                onChange={(event) =>
                  update({
                    [key]: event.currentTarget.checked ? true : undefined,
                  })
                }
              />
            </label>
          ))}
          <p className={styles.caption}>
            Unknown opening hours, distance, price or halal status are excluded
            when that filter is active. Saved Only uses your preview wishlist
            for this visit.
          </p>
          <Link
            className={`${styles.action} ${styles.yellow}`}
            href={`/${from}${search ? `?${search}` : ""}`}
          >
            Show {count} {count === 1 ? "place" : "places"}
          </Link>
          <button
            className={styles.action}
            onClick={() =>
              setDraft({
                query: "",
                category: "All",
                city: initial.city,
                distance: profile.radius,
              })
            }
          >
            Reset filters
          </button>
        </div>
      </main>
      <footer className={styles.footer}>
        <p className={shared.demoLabel}>Illustrative data</p>
      </footer>
    </div>
  );
}
