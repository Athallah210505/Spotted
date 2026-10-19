"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import { BrowseNavigation } from "@/components/layout/browse-navigation";
import { usePreviewProfile } from "@/features/profile/preview-profile";

import {
  categories,
  demoRestaurants,
  filterDemoRestaurants,
  exploreSearch,
  type DemoRestaurant,
  type ExploreFilters,
} from "./demo-data";
import styles from "@/components/layout/browse.module.css";

type Panel = "location" | "map" | null;

function Icon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <Image
      src={`/figma/explore/icon-${name}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  );
}

function PlacePhoto({
  place,
  compact = false,
  preload = false,
}: {
  place: DemoRestaurant;
  compact?: boolean;
  preload?: boolean;
}) {
  return (
    <RestaurantPhoto
      src={`/figma/explore/${place.image}`}
      alt={place.imageAlt}
      sizes={compact ? "88px" : "(max-width: 430px) calc(100vw - 40px), 390px"}
      preload={preload}
      className={compact ? styles.compactPhoto : styles.photo}
    />
  );
}

export function ExploreFeed({
  filters: initialFilters,
  usePreferredCity = false,
}: {
  filters: ExploreFilters;
  usePreferredCity?: boolean;
}) {
  const { profile } = usePreviewProfile();
  const filters = {
    ...initialFilters,
    city: usePreferredCity ? profile.city : initialFilters.city,
  };
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { savedIds, toggle } = usePreviewWishlist();
  const search = exploreSearch(filters, profile.city !== "jakarta");
  const detailHref = (id: string) =>
    `/restaurant/${id}${search ? `?${search}` : ""}`;
  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const scrollArea = useRef<HTMLElement>(null);
  const places = filterDemoRestaurants(filters, savedIds);
  const isFiltered = Boolean(search);
  const locationLabel =
    filters.city === "jakarta"
      ? "Jakarta · Blok M"
      : "Tangerang Selatan · Bintaro";
  const savedPlaces = demoRestaurants.filter((place) =>
    savedIds.includes(place.id),
  );
  const nearbyPlaces =
    filters.city === "jakarta"
      ? savedPlaces.filter((place) => place.distanceM <= profile.radius * 1000)
      : [];
  const cafe =
    nearbyPlaces.find((place) => place.id === "kopi-halaman") ??
    nearbyPlaces[0];
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`restaurants in ${locationLabel.replace(" · ", " ")}`)}`;

  useEffect(() => {
    if (panel) {
      if (!dialog.current?.open) dialog.current?.showModal();
      dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
    if (!panel && dialog.current?.open) dialog.current.close();
  }, [panel]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  function updateFilters(values: Partial<ExploreFilters>) {
    const next = { ...filters, ...values };
    const params = new URLSearchParams(
      exploreSearch(next, profile.city !== "jakarta"),
    );
    startTransition(() =>
      router.replace(`/explore${params.size ? `?${params}` : ""}`, {
        scroll: false,
      }),
    );
    scrollArea.current?.scrollTo({ top: 0 });
  }

  function resetFilters() {
    startTransition(() => router.replace("/explore", { scroll: false }));
    scrollArea.current?.scrollTo({ top: 0 });
  }

  function toggleSave(place: DemoRestaurant) {
    const wasSaved = savedIds.includes(place.id);
    toggle(place.id);
    setNotice(
      `${place.name} ${wasSaved ? "removed from" : "saved to"} your preview wishlist.`,
    );
  }

  function restaurantCard(place: DemoRestaurant, preload = false) {
    const saved = savedIds.includes(place.id);
    return (
      <article className={styles.card} key={place.id} aria-label={place.name}>
        <Link
          className={styles.cardOpen}
          href={detailHref(place.id)}
          aria-label={`View ${place.name}`}
        >
          <PlacePhoto place={place} preload={preload} />
          <div className={styles.cardContent}>
            <h3 className={styles.restaurantName}>{place.name}</h3>
            <p className={styles.rating}>
              {place.rating} · Google ({place.ratingCount}){" "}
              <span className={styles.ratingDivider}>/</span> {place.category}
            </p>
            <p className={styles.supporting}>
              {place.area} ·{" "}
              {filters.city === "jakarta"
                ? place.distanceLabel
                : "Distance unavailable"}{" "}
              · RpRp
            </p>
          </div>
        </Link>
        <button
          className={styles.saveButton}
          onClick={() => toggleSave(place)}
          aria-label={`${saved ? "Remove" : "Save"} ${place.name}${saved ? " from" : " to"} wishlist`}
          aria-pressed={saved}
          title={
            saved ? "Saved in preview wishlist" : "Save in preview wishlist"
          }
        >
          <Icon name="bookmark" />
        </button>
      </article>
    );
  }

  return (
    <div
      className={styles.shell}
      onClickCapture={(event) => {
        if (!dialog.current?.open && event.target instanceof Element) {
          const trigger = event.target.closest<HTMLElement>("button, a");
          if (trigger) dialogTrigger.current = trigger;
        }
      }}
    >
      <a className={styles.skipLink} href="#explore-content">
        Skip to restaurants
      </a>
      <div className={styles.safeArea}>
        <button
          className={styles.quickLocation}
          onClick={() => setPanel("location")}
          aria-label="Choose location"
        >
          <Icon name="locate" size={16} />
        </button>
      </div>

      <main
        className={styles.scrollArea}
        ref={scrollArea}
        id="explore-content"
        tabIndex={-1}
        aria-busy={isPending}
      >
        <div className={styles.content}>
          <form
            className={styles.searchField}
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateFilters({
                query: String(form.get("q") ?? "")
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
              <Icon name="search" />
            </button>
            <input
              key={filters.query}
              name="q"
              defaultValue={filters.query}
              maxLength={120}
              aria-label="Find food, places or areas"
              placeholder="Find food, places or areas"
              type="search"
              autoComplete="off"
            />
          </form>

          <div className={styles.brandRow}>
            <button
              className={styles.locationSelector}
              onClick={() => setPanel("location")}
              aria-haspopup="dialog"
            >
              <Icon name="pin" />
              <span>{locationLabel}</span>
              <Icon name="chevron" size={16} />
            </button>
            <span className={styles.wordmark}>spotted.</span>
          </div>

          <h1 className={styles.headline}>
            Your next
            <br />
            great craving.
          </h1>

          <div
            className={styles.categoryRail}
            role="group"
            aria-label="Restaurant categories"
          >
            {categories.map((category) => (
              <button
                key={category}
                className={styles.category}
                aria-pressed={filters.category === category}
                onClick={() => updateFilters({ category })}
              >
                {category}
              </button>
            ))}
          </div>

          <Link
            className={styles.textAction}
            href={`/filters${search ? `?${search}` : ""}`}
          >
            Filters
          </Link>
          {isPending ? (
            <p role="status" className={styles.loading}>
              Updating your places…
            </p>
          ) : null}

          {isFiltered ? (
            <>
              <div className={styles.sectionHeader}>
                <h2>
                  {filters.query
                    ? `Results for “${filters.query}”`
                    : `${filters.category === "All" ? "Places" : filters.category} in your area`}
                </h2>
              </div>
              {places.length ? (
                places.map((place, index) => restaurantCard(place, index === 0))
              ) : (
                <div className={styles.emptyState}>
                  <h3>No places found</h3>
                  <p>Try another craving or reset your filters.</p>
                </div>
              )}
              <button className={styles.textAction} onClick={resetFilters}>
                Reset filters
              </button>
            </>
          ) : (
            <>
              <div className={styles.sectionHeader}>
                <h2>Top Rated in Your City</h2>
              </div>
              {demoRestaurants[0]
                ? restaurantCard(demoRestaurants[0], true)
                : null}
              <p className={styles.rankingNote}>
                Ranked by Spotted from local candidates
              </p>

              <div className={styles.sectionHeader}>
                <h2>Your Wishlist Nearby</h2>
                <Link
                  className={styles.textAction}
                  href={`/wishlist?${search ? `${search}&` : ""}view=map`}
                >
                  View map
                </Link>
              </div>
              <div className={styles.nearbyCallout}>
                <h3>
                  {nearbyPlaces.length
                    ? `${nearbyPlaces.length} saved ${nearbyPlaces.length === 1 ? "place" : "places"} within ${profile.radius} km`
                    : "No saved places nearby"}
                </h3>
                <p>
                  {nearbyPlaces.length
                    ? "Something you saved is around the corner."
                    : "Save a place to keep it in your food plans."}
                </p>
              </div>
              {cafe ? (
                <article
                  className={styles.compactCard}
                  aria-label={`Nearby ${cafe.name}`}
                >
                  <Link
                    className={styles.compactPhotoButton}
                    aria-label={`View ${cafe.name}`}
                    href={detailHref(cafe.id)}
                  >
                    <PlacePhoto place={cafe} compact />
                  </Link>
                  <div className={styles.compactDetails}>
                    <Link
                      className={styles.nameButton}
                      href={detailHref(cafe.id)}
                    >
                      {cafe.name}
                    </Link>
                    <p>
                      {cafe.rating} · Google ({cafe.ratingCount})
                    </p>
                    <p className={styles.supporting}>
                      Saved · Nearby · {cafe.distanceLabel}
                    </p>
                    <div className={styles.compactActions}>
                      <button onClick={() => toggleSave(cafe)}>Remove</button>
                      <button onClick={() => setPanel("map")}>
                        Directions
                      </button>
                    </div>
                  </div>
                </article>
              ) : null}

              <div className={styles.sectionHeader}>
                <h2>Near You</h2>
                <Link
                  className={styles.textAction}
                  href={`/map${search ? `?${search}` : ""}`}
                >
                  View map
                </Link>
              </div>
              {demoRestaurants[2] ? restaurantCard(demoRestaurants[2]) : null}
              <div className={styles.sectionHeader}>
                <h2>Explore by Category</h2>
              </div>
              <div
                className={styles.categoryRail}
                role="group"
                aria-label="Explore by category"
              >
                {(["Japanese", "Coffee", "Matcha", "Dessert"] as const).map(
                  (category) => (
                    <button
                      className={styles.category}
                      key={category}
                      data-featured={category === "Japanese"}
                      onClick={() => updateFilters({ category })}
                    >
                      {category}
                    </button>
                  ),
                )}
              </div>
              <p className={styles.supporting}>
                You’re all caught up for this area.
              </p>
            </>
          )}
        </div>
      </main>

      <BrowseNavigation
        active="Explore"
        search={search}
        onExplore={() => {
          setPanel(null);
          resetFilters();
        }}
      />

      {notice ? (
        <p className={styles.toast} role="status">
          {notice}
        </p>
      ) : null}

      <dialog
        className={styles.dialog}
        ref={dialog}
        aria-labelledby="explore-dialog-title"
        onClose={() => {
          setPanel(null);
          dialogTrigger.current?.focus({ preventScroll: true });
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])',
            ),
          ].filter((element) => element.getClientRects().length);
          if (!controls.length) return;
          event.preventDefault();
          const index = controls.indexOf(document.activeElement as HTMLElement);
          const next = event.shiftKey
            ? index <= 0
              ? controls.length - 1
              : index - 1
            : (index + 1) % controls.length;
          controls[next]?.focus();
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            dialog.current?.close();
        }}
      >
        <button
          className={styles.closeDialog}
          onClick={() => dialog.current?.close()}
          aria-label="Close dialog"
        >
          ×
        </button>
        {panel === "location" ? (
          <>
            <h2 id="explore-dialog-title">Where are you craving?</h2>
            <p>Choose an area to explore the sample places.</p>
            {(["jakarta", "tangsel"] as const).map((city) => (
              <button
                key={city}
                className={styles.locationOption}
                aria-pressed={filters.city === city}
                onClick={() => {
                  updateFilters({ city });
                  setPanel(null);
                }}
              >
                <Icon name="pin" />
                <span>
                  {city === "jakarta"
                    ? "Jakarta · Blok M"
                    : "Tangerang Selatan · Bintaro"}
                </span>
              </button>
            ))}
          </>
        ) : panel === "map" ? (
          <>
            <h2 id="explore-dialog-title">Explore this area</h2>
            <p>{locationLabel}</p>
            <p>
              The in-app map is not connected yet. These restaurant names and
              distances are illustrative.
            </p>
            <a
              className={styles.primaryButton}
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open area in Google Maps
            </a>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
