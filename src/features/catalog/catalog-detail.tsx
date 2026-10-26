import Link from "next/link";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import { DetailIcon } from "@/features/restaurants/detail-icon";
import { DetailSaveButton } from "@/features/wishlist/detail-save-button";
import { findCatalogPlace } from "./catalog";
import { catalogDetailHref } from "./catalog-media";
import { areaNames, openingLabel, type GooglePlace } from "./google-data";
import { OpeningHours } from "./opening-hours";
import styles from "@/features/restaurants/restaurant-detail.module.css";
import menuStyles from "./google-ui.module.css";

export function CatalogDetail({
  place,
  tab,
  backHref,
}: {
  place: GooglePlace;
  tab: "overview" | "menu" | "reviews" | "tiktok";
  backHref: string;
}) {
  const base = catalogDetailHref(place);
  const context = new URLSearchParams(backHref.split("?")[1]);
  if (backHref.startsWith("/wishlist")) context.set("from", "wishlist");
  if (backHref.startsWith("/map")) context.set("from", "map");
  const from = context.size ? `&${context}` : "";
  const overview = tab === "overview" || tab === "menu";
  const overviewHref = `${base}${from ? `?${from.slice(1)}` : ""}`;
  const inspection = findCatalogPlace(
    base.split("/").pop()!,
  )?.websiteInspection;
  const menu = inspection?.status === "fetched" ? inspection.menuUrl : null;
  function sections() {
    return (
      <nav className={styles.sections} aria-label="Restaurant sections">
        {(
          [
            ["menu", "Menu"],
            ["reviews", "Reviews"],
            ["tiktok", "TikTok"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={`${base}?tab=${value}${from}`}
            aria-current={
              (overview ? "menu" : tab) === value ? "page" : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>
    );
  }
  function rating() {
    return (
      <div
        className={styles.rating}
        aria-label={`${place.rating} Google rating from ${place.reviewCount} reviews`}
      >
        <strong>{place.rating.toFixed(1)}</strong>
        <div>
          <b>{place.reviewCount.toLocaleString("id-ID")} Google ratings</b>
          {place.hours.length ? (
            <p className={styles.open}>{openingLabel(place)}</p>
          ) : null}
        </div>
      </div>
    );
  }
  function mapsAction() {
    return (
      <a
        className={`${styles.action} ${styles.primary}`}
        href={place.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Buka Google Maps"
      >
        <DetailIcon name="external-white" />
        <span>Get Directions</span>
      </a>
    );
  }
  return (
    <div className={`${styles.shell} ${overview ? styles.menuShell : ""}`}>
      <a className={styles.skipLink} href="#restaurant-content">
        Skip to restaurant details
      </a>
      <div className={styles.safeArea}>
        <Link
          className={styles.locate}
          href={backHref}
          aria-label="Back to places"
        >
          <DetailIcon name="locate" />
        </Link>
      </div>
      <main className={styles.scrollArea} id="restaurant-content" tabIndex={-1}>
        <div className={styles.content}>
          {overview ? (
            <>
              <div className={styles.heroWrap}>
                <RestaurantPhoto
                  src={place.photoPath}
                  alt={place.name}
                  className={styles.hero}
                  sizes="(max-width: 430px) 100vw, 430px"
                  preload
                />
                <Link
                  className={`${styles.back} ${styles.heroBack}`}
                  href={backHref}
                  aria-label="Back"
                >
                  <DetailIcon name="back" />
                </Link>
                <DetailSaveButton
                  id={place.id}
                  name={place.name}
                  savedHref={base}
                  redirectOnSave={false}
                  compact
                />
              </div>
              <section
                className={styles.editorialPanel}
                aria-label="Overview tempat"
              >
                <p className={styles.eyebrow}>
                  {place.category.toUpperCase()} /{" "}
                  {areaNames[place.area]?.toUpperCase()}
                </p>
                <h1 className={styles.name}>{place.name}</h1>
                {rating()}
                {place.address ? (
                  <p className={styles.address}>{place.address}</p>
                ) : null}
                <OpeningHours place={place} />
                {sections()}
                <section
                  className={menuStyles.overview}
                  aria-label="Tentang tempat"
                >
                  <h2>Overview</h2>
                  <p className={styles.supporting}>
                    {place.description ?? (
                      <>
                        {place.name} merupakan{" "}
                        {place.category.toLocaleLowerCase("id-ID")} di kawasan{" "}
                        {areaNames[place.area]}, Jakarta.
                      </>
                    )}
                  </p>
                </section>
                <section
                  className={menuStyles.menuSection}
                  aria-label="Menu dari Google reviews"
                >
                  <h2>A taste of what’s here.</h2>
                  {place.menuPhotos.length ? (
                    <>
                      <p className={menuStyles.menuNote}>
                        Pilihan dari foto pengunjung di Google.
                      </p>
                      <div className={menuStyles.menuGrid}>
                        {place.menuPhotos.map((item) => (
                          <figure key={item.photoPath}>
                            <a
                              href={item.photoPath}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Lihat foto ${item.name}`}
                            >
                              <RestaurantPhoto
                                src={item.photoPath}
                                alt={item.name}
                                className={menuStyles.menuPhoto}
                                sizes="(max-width: 430px) 50vw, 190px"
                              />
                            </a>
                            <figcaption>{item.name}</figcaption>
                          </figure>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className={styles.supporting}>
                      Foto menu belum tersedia untuk tempat ini.
                    </p>
                  )}
                  <a
                    className={menuStyles.sourceLink}
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Lihat menu &amp; foto di Google Maps{" "}
                    <DetailIcon name="external" />
                  </a>
                </section>
                {menu ? (
                  <a
                    className={styles.action}
                    href={menu}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Buka menu di website"
                  >
                    <DetailIcon name="external" />
                    <span>Open official menu</span>
                  </a>
                ) : null}
              </section>
            </>
          ) : (
            <>
              <header className={styles.header}>
                <Link
                  className={styles.back}
                  href={overviewHref}
                  aria-label="Back to restaurant"
                >
                  <DetailIcon name="back" />
                </Link>
                <h1>{place.name}</h1>
              </header>
              {rating()}
              {sections()}
              {tab === "reviews" ? (
                <section aria-label="Reviews tempat">
                  {place.reviews.length ? (
                    place.reviews.map((review) => (
                      <article
                        className={styles.review}
                        key={review.authorUrl}
                        aria-label={`Review ${review.author}`}
                      >
                        <b>
                          <a
                            href={review.authorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {review.author}
                          </a>{" "}
                          · {review.rating} / 5
                        </b>
                        <blockquote>“{review.excerpt}”</blockquote>
                      </article>
                    ))
                  ) : (
                    <p className={styles.supporting}>Ulasan belum tersedia.</p>
                  )}
                  <a
                    className={`${styles.action} ${styles.primary}`}
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Lihat semua ulasan di Google Maps
                  </a>
                </section>
              ) : (
                <>
                  <h2>From your saved links</h2>
                  <p className={styles.supporting}>
                    Belum ada video tersimpan untuk tempat ini.
                  </p>
                  <h2>Public restaurant videos</h2>
                  <div className={styles.empty}>
                    <DetailIcon name="search" />
                    <h3>Not available yet</h3>
                    <p className={styles.muted}>
                      Belum ada video terverifikasi untuk tempat ini.
                    </p>
                    <Link
                      className={`${styles.action} ${styles.yellow}`}
                      href={overviewHref}
                    >
                      Back to restaurant
                    </Link>
                  </div>
                </>
              )}
              {mapsAction()}
              <Link className={styles.action} href={backHref} aria-label="Back">
                Back to places
              </Link>
            </>
          )}
        </div>
      </main>
      <footer className={styles.dock}>
        {overview ? (
          <div className={styles.actions}>
            <DetailSaveButton
              id={place.id}
              name={place.name}
              savedHref={base}
              redirectOnSave={false}
            />
            {mapsAction()}
          </div>
        ) : null}
        <p className={styles.demoLabel}>
          <a href={place.mapsUrl} target="_blank" rel="noopener noreferrer">
            Google Maps
          </a>
        </p>
      </footer>
    </div>
  );
}
