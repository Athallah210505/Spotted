"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { BrowseIcon } from "@/components/layout/browse-icon";
import { BrowseNavigation } from "@/components/layout/browse-navigation";
import { PreviewDialog } from "@/components/ui/preview-dialog";
import {
  categories,
  demoRestaurants,
  exploreSearch,
  filterDemoRestaurants,
  type ExploreFilters,
} from "@/features/explore/demo-data";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";
import shared from "@/components/layout/browse.module.css";
import { radii, type Radius } from "./map-options";
import { SchematicMap } from "./schematic-map";
import styles from "./discovery.module.css";

type Panel = "location" | "profile" | "directions" | "import" | null;

export function DiscoveryPage({
  wishlist,
  filters,
  radius,
  mapView,
}: {
  wishlist: boolean;
  filters: ExploreFilters;
  radius: Radius;
  mapView: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { savedIds, toggle } = usePreviewWishlist();
  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState("");
  const trigger = useRef<HTMLElement | null>(null);
  const scrollArea = useRef<HTMLElement>(null);
  const search = exploreSearch(filters);
  const saved = demoRestaurants.filter((place) => savedIds.includes(place.id));
  const nearby = saved.filter(
    (place) => filters.city === "jakarta" && place.distanceM <= radius * 1000,
  );
  const places = wishlist
    ? [...saved].sort((a, b) => a.distanceM - b.distanceM)
    : filterDemoRestaurants(filters);
  const area =
    filters.city === "jakarta"
      ? "Jakarta · Blok M"
      : "Tangerang Selatan · Bintaro";
  const areaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`restaurants in ${area.replace(" · ", " ")}`)}`;
  const detailHref = (id: string) => {
    const params = new URLSearchParams(search);
    params.set("from", wishlist ? "wishlist" : "map");
    if (wishlist && mapView) params.set("view", "map");
    if (radius !== 5) params.set("radius", String(radius));
    return `/restaurant/${id}?${params}`;
  };

  function href(map: boolean, nextRadius = radius) {
    const params = new URLSearchParams(search);
    if (wishlist && map) params.set("view", "map");
    if (nextRadius !== 5) params.set("radius", String(nextRadius));
    return `${wishlist ? "/wishlist" : map ? "/map" : "/explore"}${params.size ? `?${params}` : ""}`;
  }
  function update(values: Partial<ExploreFilters>) {
    const params = new URLSearchParams(
      exploreSearch({ ...filters, ...values }),
    );
    startTransition(() =>
      router.replace(`/map${params.size ? `?${params}` : ""}`, {
        scroll: false,
      }),
    );
  }
  function open(value: Panel, button: HTMLElement) {
    trigger.current = button;
    setPanel(value);
  }
  function viewSwitch() {
    return (
      <nav className={styles.viewSwitch} aria-label="Display mode">
        <Link href={href(false)} aria-current={!mapView ? "page" : undefined}>
          <BrowseIcon
            source="maps"
            name={!mapView ? "list-white" : "list-blue"}
          />
          <span>List</span>
        </Link>
        <Link href={href(true)} aria-current={mapView ? "page" : undefined}>
          <BrowseIcon source="maps" name={mapView ? "map-white" : "map-blue"} />
          <span>Map</span>
        </Link>
      </nav>
    );
  }
  function radiusSelector() {
    return (
      <nav className={styles.radiusSelector} aria-label="Nearby radius">
        {radii.map((value) => (
          <Link
            key={value}
            href={href(mapView, value)}
            aria-current={radius === value ? "page" : undefined}
          >
            {value} km
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div className={shared.shell}>
      <a className={shared.skipLink} href="#discovery-content">
        Skip to {wishlist ? "wishlist" : "map"}
      </a>
      <div className={shared.safeArea}>
        <button
          className={shared.quickLocation}
          aria-label="Choose location"
          onClick={(event) => open("location", event.currentTarget)}
        >
          <BrowseIcon name="locate" size={16} />
        </button>
      </div>
      <main
        className={shared.scrollArea}
        id="discovery-content"
        ref={scrollArea}
        tabIndex={-1}
        aria-busy={pending}
      >
        <div className={styles.content}>
          {wishlist ? (
            <>
              {!mapView ? (
                <p className={styles.eyebrow}>YOUR WISHLIST</p>
              ) : null}
              <h1>
                {mapView ? (
                  <>
                    Cravings,
                    <br />
                    closer than you think.
                  </>
                ) : (
                  <>
                    Saved for
                    <br />
                    your next craving.
                  </>
                )}
              </h1>
              <div className={styles.savedView}>
                <p>
                  {saved.length} saved {saved.length === 1 ? "place" : "places"}
                </p>
                {viewSwitch()}
              </div>
              {!mapView ? (
                <>
                  <button
                    className={`${styles.action} ${styles.yellow}`}
                    onClick={(event) => open("import", event.currentTarget)}
                  >
                    <BrowseIcon source="maps" name="plus" />
                    <span>Add from TikTok</span>
                  </button>
                  <p className={styles.supporting}>
                    Nearby radius · straight-line distance
                  </p>
                </>
              ) : null}
              {radiusSelector()}
              {mapView ? (
                <p className={styles.nearbyCount}>
                  {nearby.length} nearby · within {radius} km of you
                </p>
              ) : (
                <div className={styles.summary}>
                  <h2>
                    {nearby.length} {nearby.length === 1 ? "place" : "places"}{" "}
                    within {radius} km
                  </h2>
                  <p>
                    Based on the sample Blok M location
                    {filters.city === "tangsel"
                      ? " · distance unavailable in Bintaro"
                      : ""}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className={styles.srOnly}>Explore the map</h1>
              <form
                className={shared.searchField}
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
                  type="submit"
                  className={shared.searchSubmit}
                  aria-label="Search restaurants"
                >
                  <BrowseIcon name="search" />
                </button>
                <input
                  name="q"
                  type="search"
                  maxLength={120}
                  defaultValue={filters.query}
                  key={filters.query}
                  aria-label="Find food, places or areas"
                  placeholder="Find food, places or areas"
                />
              </form>
              <button
                className={`${shared.locationSelector} ${styles.location}`}
                onClick={(event) => open("location", event.currentTarget)}
                aria-label="Change map area"
              >
                <BrowseIcon name="pin" />
                <span>{area}</span>
                <BrowseIcon name="chevron" size={16} />
              </button>
              <div
                className={shared.categoryRail}
                role="group"
                aria-label="Restaurant categories"
              >
                {(
                  [
                    "All",
                    "Coffee",
                    "Japanese",
                    "Matcha",
                    ...categories.filter(
                      (category) =>
                        !["All", "Coffee", "Japanese", "Matcha"].includes(
                          category,
                        ),
                    ),
                  ] as const
                ).map((category) => (
                  <button
                    className={shared.category}
                    key={category}
                    aria-pressed={filters.category === category}
                    onClick={() => update({ category })}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className={styles.mapTools}>
                <button
                  className={`${styles.action} ${styles.yellow}`}
                  onClick={() => {
                    setNotice(
                      `${places.length} sample ${places.length === 1 ? "place" : "places"} in ${area}. Live area search is not connected.`,
                    );
                    scrollArea.current
                      ?.querySelector(
                        '[aria-label="Illustrative restaurant map"]',
                      )
                      ?.scrollIntoView({ block: "nearest" });
                  }}
                >
                  Search This Area
                </button>
                {viewSwitch()}
              </div>
            </>
          )}

          {notice ? (
            <p className={styles.feedback} role="status">
              {notice}
            </p>
          ) : null}
          {mapView ? (
            <>
              <SchematicMap
                places={places}
                savedIds={savedIds}
                radius={radius}
                wishlist={wishlist}
                city={filters.city}
                detailHref={detailHref}
                onLocate={() => {
                  setNotice(
                    "This schematic uses the sample Blok M area. Choose an area to browse; live location is not connected.",
                  );
                  scrollArea.current?.scrollTo({ top: 0 });
                }}
              />
              {places.length === 0 ? (
                <div className={shared.emptyState}>
                  <h2>
                    {wishlist ? "Your wishlist is empty" : "No places found"}
                  </h2>
                  <p>
                    {wishlist
                      ? "Save a restaurant from Explore to see it here."
                      : "Try another search or category."}
                  </p>
                  <Link className={styles.action} href="/explore">
                    Browse restaurants
                  </Link>
                </div>
              ) : null}
              <p className={styles.caption}>
                Schematic map · not navigation data. Google Maps attribution
                will appear with the live map.
              </p>
            </>
          ) : (
            <>
              {places.length ? (
                places.map((place) => {
                  const isNearby = nearby.some(
                    (candidate) => candidate.id === place.id,
                  );
                  return (
                    <article
                      key={place.id}
                      className={`${styles.savedCard} ${isNearby ? styles.nearbyCard : ""}`}
                      aria-label={place.name}
                    >
                      <Link
                        href={detailHref(place.id)}
                        aria-label={`View ${place.name}`}
                      >
                        <RestaurantPhoto
                          src={`/figma/explore/${place.image}`}
                          alt={place.imageAlt}
                          className={styles.photo}
                          sizes="88px"
                        />
                      </Link>
                      <div className={styles.cardDetails}>
                        <Link
                          className={styles.placeName}
                          href={detailHref(place.id)}
                        >
                          {place.name}
                        </Link>
                        <p>
                          {place.rating} · Google ({place.ratingCount})
                        </p>
                        <p className={styles.cardMeta}>
                          {filters.city !== "jakarta"
                            ? `${place.category} · ${place.area} · Distance unavailable`
                            : isNearby
                              ? `Saved · Nearby · ${place.distanceLabel}`
                              : `${place.category} · ${place.area} · ${place.distanceLabel}`}
                        </p>
                        <div className={styles.cardActions}>
                          <button
                            aria-label={`Remove ${place.name} from wishlist`}
                            onClick={() => {
                              toggle(place.id);
                              setNotice(
                                `${place.name} removed from your preview wishlist.`,
                              );
                            }}
                          >
                            Remove
                          </button>
                          <button
                            onClick={(event) =>
                              open("directions", event.currentTarget)
                            }
                          >
                            Directions
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className={shared.emptyState}>
                  <h2>Your wishlist is empty</h2>
                  <p>Save a restaurant from Explore to see it here.</p>
                  <Link className={styles.action} href="/explore">
                    Browse restaurants
                  </Link>
                </div>
              )}
              {savedIds.includes("kopi-halaman") ? (
                <button
                  className={styles.action}
                  onClick={() => {
                    toggle("kopi-halaman");
                    setNotice(
                      "Kopi Halaman removed from your preview wishlist.",
                    );
                  }}
                >
                  <BrowseIcon name="close" source="maps" />
                  <span>Remove Kopi Halaman</span>
                </button>
              ) : null}
            </>
          )}
        </div>
      </main>
      <BrowseNavigation
        active={wishlist ? "Wishlist" : "Map"}
        search={search}
        onProfile={(button) => {
          trigger.current = button;
          setPanel("profile");
        }}
      />
      {panel ? (
        <PreviewDialog
          trigger={trigger}
          onClose={() => setPanel(null)}
          title={
            panel === "location"
              ? "Where are you craving?"
              : panel === "profile"
                ? "Browsing the preview"
                : panel === "import"
                  ? "TikTok import is not connected"
                  : "Directions unavailable"
          }
        >
          {panel === "location" ? (
            <>
              <p>Choose an area to explore the sample places.</p>
              {(["jakarta", "tangsel"] as const).map((city) => (
                <button
                  key={city}
                  className={shared.locationOption}
                  aria-pressed={filters.city === city}
                  onClick={() => {
                    const params = new URLSearchParams(search);
                    if (city === "tangsel") params.set("city", city);
                    else params.delete("city");
                    if (wishlist && mapView) params.set("view", "map");
                    if (radius !== 5) params.set("radius", String(radius));
                    startTransition(() =>
                      router.replace(
                        `${wishlist ? "/wishlist" : "/map"}${params.size ? `?${params}` : ""}`,
                      ),
                    );
                    setPanel(null);
                  }}
                >
                  {city === "jakarta"
                    ? "Jakarta · Blok M"
                    : "Tangerang Selatan · Bintaro"}
                </button>
              ))}
            </>
          ) : panel === "import" ? (
            <p>
              This preview has no TikTok import service. You can save sample
              restaurants from Explore.
            </p>
          ) : panel === "profile" ? (
            <>
              <p>
                Account sign-in is not connected. Sample saves last for this
                visit until you reload.
              </p>
              <Link className={styles.action} href="/explore">
                Browse restaurants
              </Link>
            </>
          ) : (
            <>
              <p>
                These restaurants and addresses are illustrative. Explore the
                real area in Google Maps instead.
              </p>
              <a
                className={`${styles.action} ${styles.primary}`}
                href={areaUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open area in Google Maps
              </a>
            </>
          )}
        </PreviewDialog>
      ) : null}
    </div>
  );
}
