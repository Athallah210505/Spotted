import Link from "next/link";
import { catalog, kindLabels } from "./catalog";
import { catalogPhotos, catalogDetailHref } from "./catalog-media";
import { CatalogPhoto } from "./catalog-photo";
import { CatalogRating } from "./catalog-rating";
import styles from "./catalog.module.css";

export function CatalogHighlights() {
  const places = Object.keys(catalogPhotos).flatMap((id) =>
    catalog.places.filter((place) => place.id === id),
  );
  return (
    <section className={styles.highlights} aria-label="Tempat nyata di Jakarta">
      <h2>Jakarta, buat rencana berikutnya.</h2>
      <p>Tempat dari OpenStreetMap. Ketuk kartu untuk melihat detailnya.</p>
      {places.map((place, index) => (
        <article
          className={styles.highlight}
          key={place.id}
          aria-label={place.name}
        >
          <CatalogPhoto
            placeId={place.id}
            href={catalogDetailHref(place)}
            preload={index === 0}
          >
            <Link
              href={catalogDetailHref(place)}
              className={styles.highlightBody}
              aria-label={`Lihat detail ${place.name}`}
            >
              <div className={styles.identityRow}>
                <h3>{place.name}</h3>
                <CatalogRating placeId={place.id} />
              </div>
              <p>
                {kindLabels[place.kind]} ·{" "}
                {catalog.areas.find((area) => area.id === place.area)?.name}
              </p>
              {place.address ? <p>{place.address}</p> : null}
              <span className={styles.mapsAction}>Lihat detail</span>
            </Link>
          </CatalogPhoto>
        </article>
      ))}
      <Link className={styles.mapsAction} href="/catalog">
        Lihat semua {catalog.places.length} tempat
      </Link>
      <a
        className={styles.sourceCredit}
        href={catalog.licenseUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        © OpenStreetMap contributors · ODbL
      </a>
    </section>
  );
}
