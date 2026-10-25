import Link from "next/link";
import { JourneyLayout } from "@/features/tiktok/journey-layout";
import { catalog, kindLabels } from "./catalog";
import {
  catalogDetailHref,
  catalogRatings,
  googleMapsUrl,
} from "./catalog-media";
import { CatalogPhoto } from "./catalog-photo";
import { CatalogRating } from "./catalog-rating";
import styles from "./catalog.module.css";

export function CatalogDetail({
  place,
  tab,
  backHref,
}: {
  place: (typeof catalog.places)[number];
  tab: "overview" | "menu" | "reviews";
  backHref: "/explore" | "/catalog";
}) {
  const rating = catalogRatings[place.id];
  const base = catalogDetailHref(place);
  const from = backHref === "/catalog" ? "&from=catalog" : "";
  const menu =
    place.websiteInspection?.status === "fetched"
      ? place.websiteInspection.menuUrl
      : null;
  return (
    <JourneyLayout
      title="Detail tempat"
      backHref={backHref}
      footer={
        <a
          className={styles.attribution}
          href={catalog.licenseUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          © OpenStreetMap contributors · ODbL
        </a>
      }
    >
      <CatalogPhoto placeId={place.id} preload />
      <div className={styles.identityRow}>
        <h1>{place.name}</h1>
        <CatalogRating placeId={place.id} />
      </div>
      <p>
        {kindLabels[place.kind]} ·{" "}
        {catalog.areas.find((area) => area.id === place.area)?.name}
      </p>
      <nav className={styles.tabs} aria-label="Restaurant sections">
        {(
          [
            ["overview", "Overview"],
            ["menu", "Menu"],
            ["reviews", "Reviews"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={`${base}?tab=${value}${from}`}
            aria-current={tab === value ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {tab === "overview" ? (
        <section className={styles.place} aria-label="Overview tempat">
          <h2>Overview</h2>
          <dl className={styles.fields}>
            <div>
              <dt>Alamat</dt>
              <dd>{place.address ?? "Belum tersedia"}</dd>
            </div>
            <div>
              <dt>Cuisine</dt>
              <dd>{place.cuisine ?? "Belum tersedia"}</dd>
            </div>
            <div>
              <dt>Jam buka</dt>
              <dd>{place.openingHours ?? "Belum tersedia"}</dd>
            </div>
          </dl>
          {place.website ? (
            <a href={place.website} target="_blank" rel="noopener noreferrer">
              Website tempat
            </a>
          ) : (
            <p>Website belum tersedia.</p>
          )}
          <a href={place.sourceUrl} target="_blank" rel="noopener noreferrer">
            Lihat sumber lokasi OSM
          </a>
          <p>
            Data tempat berasal dari snapshot OSM; jam buka dan kondisi usaha
            belum diverifikasi pemilik.
          </p>
        </section>
      ) : tab === "menu" ? (
        <section className={styles.place} aria-label="Menu tempat">
          <h2>Menu</h2>
          <p>
            {menu
              ? "Lihat menu di website sumber. Item dan harga belum tersedia di SPOTTED."
              : "Menu belum tersedia untuk tempat ini."}
          </p>
          {menu ? (
            <a href={menu} target="_blank" rel="noopener noreferrer">
              Buka menu di website
            </a>
          ) : null}
        </section>
      ) : (
        <section className={styles.place} aria-label="Reviews tempat">
          <h2>Reviews</h2>
          {rating ? (
            <>
              <p>
                {rating.value.toFixed(1)}/5 · {rating.reviewCount} ulasan di{" "}
                {rating.provider}
              </p>
              <a
                href={rating.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Lihat ulasan di {rating.provider}
              </a>
            </>
          ) : (
            <p>Rating dan ulasan belum tersedia untuk tempat ini.</p>
          )}
          <p>Review Google belum tersedia di SPOTTED.</p>
        </section>
      )}
      {rating ? (
        <p className={styles.ratingNote}>
          Rating snapshot {rating.provider}, halaman sumber diakses{" "}
          {rating.checkedAt}; bukan data live.{" "}
          <a
            className={styles.sourceCredit}
            href={rating.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sumber rating
          </a>
        </p>
      ) : (
        <p className={styles.ratingNote}>
          Rating belum tersedia untuk tempat ini.
        </p>
      )}
      <a
        className={styles.mapsAction}
        href={googleMapsUrl(place)}
        target="_blank"
        rel="noopener noreferrer"
      >
        Buka Google Maps
      </a>
    </JourneyLayout>
  );
}
