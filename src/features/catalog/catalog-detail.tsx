import Link from "next/link";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import { DetailIcon } from "@/features/restaurants/detail-icon";
import { DetailSaveButton } from "@/features/wishlist/detail-save-button";
import { catalog, kindLabels } from "./catalog";
import {
  catalogDetailHref,
  catalogPhotos,
  catalogRatings,
  googleMapsUrl,
} from "./catalog-media";
import styles from "@/features/restaurants/restaurant-detail.module.css";
import mediaStyles from "./catalog.module.css";
import photoStyles from "@/features/restaurants/restaurant-photo.module.css";

export function CatalogDetail({
  place,
  tab,
  backHref,
}: {
  place: (typeof catalog.places)[number];
  tab: "overview" | "menu" | "reviews" | "tiktok";
  backHref: "/explore" | "/catalog" | "/wishlist";
}) {
  const rating = catalogRatings[place.id];
  const photo = catalogPhotos[place.id];
  const base = catalogDetailHref(place);
  const from = backHref !== "/explore" ? `&from=${backHref.slice(1)}` : "";
  const overview = tab === "overview" || tab === "menu";
  const menu =
    place.websiteInspection?.status === "fetched"
      ? place.websiteInspection.menuUrl
      : null;
  const overviewHref = `${base}${from ? `?${from.slice(1)}` : ""}`;
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
  function ratingBlock() {
    return (
      <div
        className={styles.rating}
        aria-label={
          rating
            ? `${rating.value} dari 5 · ${rating.provider}, snapshot sumber`
            : "Rating belum tersedia"
        }
      >
        <strong>{rating ? rating.value.toFixed(1) : "N/A"}</strong>
        <div>
          <b>
            {rating
              ? `${rating.reviewCount} ${rating.provider} ratings`
              : "Belum ada rating"}
          </b>
          <p className={styles.open}>
            {place.openingHours ?? "Hours unavailable"}
          </p>
        </div>
      </div>
    );
  }
  function mapsAction() {
    return (
      <a
        className={`${styles.action} ${styles.primary}`}
        href={googleMapsUrl(place)}
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
                {photo ? (
                  <RestaurantPhoto
                    src={photo.src}
                    alt={photo.alt}
                    className={styles.hero}
                    sizes="(max-width: 430px) 100vw, 430px"
                    preload
                  />
                ) : (
                  <div
                    className={styles.hero}
                    role="img"
                    aria-label="Photo unavailable"
                  >
                    <span className={photoStyles.fallback}>
                      Photo unavailable
                    </span>
                  </div>
                )}
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
                {photo ? (
                  <div
                    className={styles.gallery}
                    aria-label="Restaurant photo gallery"
                  >
                    <button disabled aria-label="Previous photo">
                      <DetailIcon name="previous" />
                    </button>
                    <p>1 / 1</p>
                    <button disabled aria-label="Next photo">
                      <DetailIcon name="arrow" />
                    </button>
                  </div>
                ) : null}
              </div>
              <section
                className={styles.editorialPanel}
                aria-label="Overview tempat"
              >
                <p className={styles.eyebrow}>
                  {kindLabels[place.kind].toUpperCase()} /{" "}
                  {catalog.areas
                    .find((area) => area.id === place.area)
                    ?.name.toUpperCase()}
                </p>
                <h1 className={styles.name}>{place.name}</h1>
                {ratingBlock()}
                <p className={styles.address}>
                  {place.address ?? "Alamat belum tersedia"}
                </p>
                {sections()}
                <h2>A taste of what’s here.</h2>
                <section aria-label="Menu tempat" className={styles.menuCard}>
                  <p>
                    {menu
                      ? "Lihat menu di website sumber. Item dan harga belum tersedia di SPOTTED."
                      : "Menu belum tersedia untuk tempat ini."}
                  </p>
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
                ) : (
                  <button className={styles.action} disabled>
                    Official menu unavailable
                  </button>
                )}
                <p className={styles.caption}>
                  Jam buka dan informasi tempat dari OSM belum diverifikasi
                  pemilik.
                </p>
                {place.website ? (
                  <a
                    className={styles.action}
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Website tempat
                  </a>
                ) : null}
                <a
                  className={mediaStyles.sourceCredit}
                  href={place.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lihat sumber lokasi OSM
                </a>
                {photo ? (
                  <div className={mediaStyles.credit}>
                    <a
                      href={photo.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Foto: {photo.author}
                    </a>{" "}
                    ·{" "}
                    <a
                      href={photo.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {photo.license}
                    </a>
                    <span>{photo.note}</span>
                  </div>
                ) : null}
                {rating ? (
                  <p className={styles.caption}>
                    Rating snapshot {rating.provider}, halaman sumber diakses{" "}
                    {rating.checkedAt}.{" "}
                    <a
                      className={mediaStyles.sourceCredit}
                      href={rating.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Sumber rating
                    </a>
                  </p>
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
              {ratingBlock()}
              {sections()}
              {tab === "reviews" ? (
                <section className={styles.review} aria-label="Reviews tempat">
                  <h2>Reviews</h2>
                  {rating ? (
                    <>
                      <p>
                        {rating.value.toFixed(1)}/5 · {rating.reviewCount}{" "}
                        ulasan di {rating.provider}
                      </p>
                      <a
                        className={styles.action}
                        href={rating.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Lihat ulasan di {rating.provider}
                      </a>
                      <p className={styles.caption}>
                        Rating snapshot {rating.provider}, halaman sumber
                        diakses {rating.checkedAt}.
                      </p>
                    </>
                  ) : (
                    <p>Rating dan ulasan belum tersedia untuk tempat ini.</p>
                  )}
                  <p className={styles.caption}>
                    Review Google belum tersedia di SPOTTED.
                  </p>
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
          <a
            className={mediaStyles.attribution}
            href={catalog.licenseUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            © OpenStreetMap contributors · ODbL
          </a>
        </p>
      </footer>
    </div>
  );
}
