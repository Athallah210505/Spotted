"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import { BrowseNavigation } from "@/components/layout/browse-navigation";
import { PreviewDialog } from "@/components/ui/preview-dialog";
import { usePreviewProfile } from "@/features/profile/preview-profile";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";
import { googlePlaces } from "@/features/catalog/google-data";
import { FoodPlaceCard } from "@/features/catalog/food-place-card";
import { useFoodPlaces } from "@/features/catalog/use-food-places";
import { CravingGame } from "./craving-game";
import { catalogDetailHref } from "@/features/catalog/catalog-media";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import {
  categories,
  exploreSearch,
  sortOptions,
  type ExploreFilters,
} from "./demo-data";
import styles from "@/components/layout/browse.module.css";
import dataStyles from "@/features/catalog/google-ui.module.css";
import explore from "./explore.module.css";

const menuPicks = googlePlaces.flatMap((place) =>
  place.menuPhotos.slice(0, 1).map((photo) => ({ place, photo })),
);

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
  const catalog = useFoodPlaces(
    exploreSearch(filters, profile.city !== "jakarta"),
    filters.savedOnly ? savedIds : [],
  );
  const places = catalog.data?.pages.flatMap((page) => page.places) ?? [];
  const total = catalog.data?.pages[0]?.total ?? 0;
  const savedCount = googlePlaces.filter((place) =>
    savedIds.includes(place.id),
  ).length;
  const [pending, startTransition] = useTransition();
  const [locationOpen, setLocationOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const scrollArea = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const root = scrollArea.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        }
      },
      { root, threshold: 0.12, rootMargin: "-140px 0px -24px 0px" },
    );
    root.querySelectorAll("article").forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [search, places.length]);
  function update(values: Partial<ExploreFilters>) {
    const query = exploreSearch(
      { ...filters, ...values },
      profile.city !== "jakarta",
    );
    startTransition(() =>
      router.replace(`/explore${query ? `?${query}` : ""}`, { scroll: false }),
    );
    const main = scrollArea.current;
    if (main) {
      main.scrollTo({
        top: Math.min(
          main.scrollTop,
          main.querySelector("header")?.offsetHeight ?? 0,
        ),
      });
    }
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
    <div className={`${styles.shell} ${styles.exploreShell} ${explore.shell}`}>
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
        aria-busy={pending || catalog.isPending}
      >
        <div className={styles.content}>
          <header className={`${styles.masthead} ${explore.masthead}`}>
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
          </header>
          <div className={explore.controls}>
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
                disabled={pending}
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
                disabled={pending}
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
                  disabled={pending}
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
          </div>
          {pending ? (
            <p className={styles.srOnly} role="status">
              Updating your places…
            </p>
          ) : null}
          <section
            className={explore.results}
            data-pending={
              pending || (catalog.isFetching && !catalog.isFetchingNextPage)
            }
            aria-label="Restaurants in Jakarta"
          >
            <div className={dataStyles.sectionHeading}>
              <div>
                <h2 tabIndex={-1} id="explore-results">
                  {filters.query
                    ? `Results for ${filters.query}`
                    : "Worth a detour."}
                </h2>
                <span aria-live="polite">
                  {catalog.isPending
                    ? "Memuat katalog…"
                    : `${total.toLocaleString("en-US")} places`}{" "}
                  · {sortOptions[filters.sort ?? "recommended"]}
                </span>
              </div>
              <nav className={dataStyles.tools} aria-label="Explore controls">
                <Link href={`/filters${search ? `?${search}` : ""}`}>
                  Filters
                </Link>
                <Link
                  href={`/sort${search ? `?${search}` : ""}`}
                  aria-label={`Sort places: ${sortOptions[filters.sort ?? "recommended"]}`}
                >
                  Sort
                </Link>
              </nav>
            </div>
            <div
              className={dataStyles.quickFilters}
              role="group"
              aria-label="Quick filters"
            >
              <button
                disabled={pending}
                aria-pressed={filters.minRating === 4.5}
                onClick={() =>
                  update({
                    minRating: filters.minRating === 4.5 ? undefined : 4.5,
                  })
                }
              >
                4.5+ rated
              </button>
              <button
                disabled={pending}
                aria-pressed={filters.savedOnly === true}
                onClick={() =>
                  update({ savedOnly: filters.savedOnly ? undefined : true })
                }
              >
                <Image
                  src="/figma/editorial/bookmark.svg"
                  width={16}
                  height={16}
                  alt=""
                />
                Saved places <span>{savedCount}</span>
              </button>
            </div>
            {!search ? <CravingGame /> : null}
            {catalog.isPending ? (
              <p className={styles.loading} role="status">
                Memuat tempat makan…
              </p>
            ) : catalog.isError ? (
              <div className={styles.emptyState} role="alert">
                <p>Data tempat belum bisa dimuat.</p>
                <button
                  className={styles.textAction}
                  onClick={() => catalog.refetch()}
                >
                  Coba lagi
                </button>
              </div>
            ) : places.length ? (
              <div className={dataStyles.cards}>
                {places.map((place, index) => (
                  <Fragment key={place.id}>
                    <FoodPlaceCard
                      place={place}
                      preload={index === 0}
                      search={search}
                      featured={!search && index === 0}
                    />
                    {!search && index === 2 && menuPicks.length ? (
                      <section
                        className={dataStyles.menuPicks}
                        aria-labelledby="menu-picks-heading"
                      >
                        <h2 id="menu-picks-heading">On the table.</h2>
                        <p>A closer look, photographed by visitors.</p>
                        <div
                          className={dataStyles.dishRail}
                          role="group"
                          aria-label="Visitor menu photos"
                          tabIndex={0}
                        >
                          {menuPicks.map(({ place: venue, photo }) => (
                            <Link
                              key={venue.id}
                              href={`${catalogDetailHref(venue)}?tab=menu`}
                              aria-label={`See ${photo.name} at ${venue.name}`}
                            >
                              <RestaurantPhoto
                                src={photo.photoPath}
                                alt={photo.name}
                                className={dataStyles.dishThumb}
                                sizes="152px"
                              />
                              <strong>{photo.name}</strong>
                              <span>{venue.name}</span>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </Fragment>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <h3>No places found</h3>
                <p>
                  {filters.city === "tangsel"
                    ? "Tempat di area ini belum tersedia. Coba Jakarta."
                    : filters.savedOnly && savedCount === 0
                      ? "Belum ada tempat tersimpan. Tekan bookmark pada tempat yang ingin kamu simpan."
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
          {catalog.hasNextPage ? (
            <button
              className={explore.loadMore}
              disabled={catalog.isFetchingNextPage}
              onClick={() => catalog.fetchNextPage()}
            >
              {catalog.isFetchingNextPage
                ? "Memuat…"
                : "Lihat lebih banyak tempat"}
            </button>
          ) : null}
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
        label=""
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
          <p>
            {catalog.data?.pages[0]?.databaseTotal.toLocaleString("id-ID") ??
              "…"}{" "}
            record dalam database. Tempat tanpa nama dan listing yang ditandai
            tutup tidak ditampilkan.
          </p>
        </PreviewDialog>
      ) : null}
    </div>
  );
}
