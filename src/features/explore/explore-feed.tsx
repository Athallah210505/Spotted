"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { BrowseNavigation } from "@/components/layout/browse-navigation";
import { PreviewDialog } from "@/components/ui/preview-dialog";
import { usePreviewProfile } from "@/features/profile/preview-profile";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";
import {
  filterGooglePlaces,
  googlePlaces,
} from "@/features/catalog/google-data";
import { GooglePlaceCard } from "@/features/catalog/google-place-card";
import {
  categories,
  exploreSearch,
  sortOptions,
  type ExploreFilters,
} from "./demo-data";
import styles from "@/components/layout/browse.module.css";
import dataStyles from "@/features/catalog/google-ui.module.css";

export function ExploreFeed({
  filters: initialFilters,
  usePreferredCity = false,
}: {
  filters: ExploreFilters;
  usePreferredCity?: boolean;
}) {
  const router = useRouter();
  const { profile } = usePreviewProfile();
  const { savedIds } = usePreviewWishlist();
  const filters = {
    ...initialFilters,
    city: usePreferredCity ? profile.city : initialFilters.city,
  };
  const search = exploreSearch(filters, profile.city !== "jakarta");
  const places = filterGooglePlaces(filters, savedIds);
  const [pending, startTransition] = useTransition();
  const [locationOpen, setLocationOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const scrollArea = useRef<HTMLElement | null>(null);
  function update(values: Partial<ExploreFilters>) {
    const query = exploreSearch(
      { ...filters, ...values },
      profile.city !== "jakarta",
    );
    startTransition(() =>
      router.replace(`/explore${query ? `?${query}` : ""}`, { scroll: false }),
    );
    scrollArea.current?.scrollTo({ top: 0 });
  }
  function reset() {
    startTransition(() => router.replace("/explore", { scroll: false }));
    scrollArea.current?.scrollTo({ top: 0 });
  }
  function chooseArea(button: HTMLButtonElement) {
    trigger.current = button;
    setLocationOpen(true);
  }
  return (
    <div className={`${styles.shell} ${!search ? styles.exploreShell : ""}`}>
      <a className={styles.skipLink} href="#explore-content">
        Skip to restaurants
      </a>
      <div className={styles.safeArea}>
        <button
          className={styles.quickLocation}
          onClick={(event) => chooseArea(event.currentTarget)}
          aria-label="Choose location"
        >
          <Image
            src="/figma/explore/icon-locate.svg"
            width={16}
            height={16}
            alt=""
          />
        </button>
      </div>
      <main
        className={styles.scrollArea}
        id="explore-content"
        tabIndex={-1}
        ref={scrollArea}
        aria-busy={pending}
      >
        <div className={styles.content}>
          <header className={search ? styles.searchMasthead : styles.masthead}>
            {search ? (
              <div className={styles.searchHeader}>
                <button onClick={reset} aria-label="Back to Explore">
                  <Image
                    src="/figma/editorial/back.svg"
                    width={22}
                    height={22}
                    alt=""
                  />
                </button>
                <h1 className={styles.searchTitle}>Find a good spot.</h1>
              </div>
            ) : (
              <>
                <div className={styles.brandRow}>
                  <span className={styles.wordmark}>spotted.</span>
                  <button
                    className={styles.locationSelector}
                    onClick={(event) => chooseArea(event.currentTarget)}
                    aria-label="Choose location"
                    aria-haspopup="dialog"
                  >
                    <Image
                      src="/figma/editorial/pin.svg"
                      width={20}
                      height={20}
                      alt=""
                    />
                    <span>
                      {filters.city === "jakarta" ? "Jakarta" : "Bintaro"}
                    </span>
                  </button>
                </div>
                <div className={styles.headlineRow}>
                  <h1 className={styles.headline}>
                    Follow your
                    <br />
                    cravings.
                  </h1>
                  <Image
                    src="/figma/editorial/pin-motif.svg"
                    width={48}
                    height={48}
                    alt=""
                  />
                </div>
              </>
            )}
            <form
              className={styles.searchField}
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                update({
                  query: String(
                    new FormData(event.currentTarget).get("q") ?? "",
                  )
                    .trim()
                    .slice(0, 120),
                });
              }}
            >
              <button
                className={styles.searchSubmit}
                type="submit"
                aria-label="Search restaurants"
              >
                <Image
                  src="/figma/editorial/search.svg"
                  width={20}
                  height={20}
                  alt=""
                />
              </button>
              <input
                type="search"
                name="q"
                key={filters.query}
                defaultValue={filters.query}
                maxLength={120}
                autoComplete="off"
                aria-label="Find food, places or areas"
                placeholder="Find your next good spot"
              />
            </form>
            <div
              className={styles.categoryRail}
              role="group"
              aria-label="Restaurant categories"
            >
              {categories.map((category) => (
                <button
                  key={category}
                  className={styles.category}
                  aria-pressed={category === filters.category}
                  onClick={() => update({ category })}
                >
                  {category === "All" ? (
                    <>
                      <span aria-hidden="true">For you</span>
                      <span className={styles.srOnly}>All</span>
                    </>
                  ) : (
                    category
                  )}
                </button>
              ))}
            </div>
          </header>
          <div
            className={`${styles.searchTools} ${!search ? styles.homeTools : ""}`}
          >
            <Link
              className={styles.textAction}
              href={`/filters${search ? `?${search}` : ""}`}
            >
              Filters
            </Link>
            <Link
              className={styles.textAction}
              href={`/sort${search ? `?${search}` : ""}`}
              aria-label={`Sort places: ${sortOptions[filters.sort ?? "recommended"]}`}
            >
              {sortOptions[filters.sort ?? "recommended"]}
            </Link>
          </div>
          {pending ? (
            <p className={styles.loading} role="status">
              Updating your places…
            </p>
          ) : null}
          <section aria-label="Restaurants in Jakarta">
            <h2 className={styles.srOnly}>
              {filters.query
                ? `Results for ${filters.query}`
                : "Places for you"}
            </h2>
            {places.length ? (
              <div className={dataStyles.cards}>
                {places.map((place, index) => (
                  <GooglePlaceCard
                    key={place.id}
                    place={place}
                    preload={index === 0}
                    search={search}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3>No places found</h3>
                <p>
                  {filters.city === "tangsel"
                    ? "Tempat di area ini belum tersedia. Coba Jakarta."
                    : "Coba nama lain atau ubah filter pencarian."}
                </p>
                <button
                  className={styles.textAction}
                  onClick={() =>
                    update({
                      query: "",
                      category: "All",
                      city: "jakarta",
                      minRating: undefined,
                      distance: undefined,
                      price: undefined,
                      openNow: undefined,
                      halalOnly: undefined,
                      savedOnly: undefined,
                      sort: undefined,
                    })
                  }
                >
                  Reset filters
                </button>
              </div>
            )}
          </section>
          {search && places.length ? (
            <button className={styles.textAction} onClick={reset}>
              Reset filters
            </button>
          ) : null}
        </div>
      </main>
      <BrowseNavigation
        active="Explore"
        search={search}
        onExplore={reset}
        label={
          <a
            href="https://www.google.com/maps/search/restaurants+Jakarta/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps
          </a>
        }
      />
      {locationOpen ? (
        <PreviewDialog
          title="Choose your area"
          trigger={trigger}
          onClose={() => setLocationOpen(false)}
        >
          <button
            className={styles.primaryButton}
            onClick={() => {
              update({ city: "jakarta" });
              setLocationOpen(false);
            }}
          >
            Jakarta · Blok M
          </button>
          <button
            className={styles.primaryButton}
            onClick={() => {
              update({ city: "tangsel" });
              setLocationOpen(false);
            }}
          >
            Tangerang Selatan · Bintaro
          </button>
          <p>{googlePlaces.length} tempat tersedia di Jakarta.</p>
        </PreviewDialog>
      ) : null}
    </div>
  );
}
