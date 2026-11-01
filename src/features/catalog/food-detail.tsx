import Link from "next/link";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { DetailIcon } from "@/features/restaurants/detail-icon";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import menuStyles from "./google-ui.module.css";
import { OpeningHours } from "./opening-hours";
import { catalogDetailHref } from "./catalog-media";
import type { FoodPlace } from "./food-types";
import styles from "@/features/restaurants/restaurant-detail.module.css";

export function FoodDetail({
  place,
  backHref,
  tab,
}: {
  place: FoodPlace;
  backHref: string;
  tab: string;
}) {
  const context = new URLSearchParams(backHref.split("?")[1]);
  if (backHref.startsWith("/map")) context.set("from", "map");
  let reviews: {
    author: string;
    rating: number;
    excerpt: string;
    author_url: string;
  }[] = [];
  if (tab === "reviews") {
    const db = new DatabaseSync(
      path.join(
        process.cwd(),
        "research/jaksel-jakbar-2026-10-28/food-database.sqlite",
      ),
      { readOnly: true },
    );
    try {
      reviews = db
        .prepare(
          "SELECT author,rating,excerpt,author_url FROM google_reviews WHERE place_id=? LIMIT 5",
        )
        .all(place.id) as typeof reviews;
    } finally {
      db.close();
    }
  }
  return (
    <div className={styles.shell}>
      <main className={styles.scrollArea}>
        <div className={styles.content}>
          {place.photoPath ? (
            <div className={styles.heroWrap}>
              <RestaurantPhoto
                src={place.photoPath}
                alt={place.name}
                className={styles.hero}
                sizes="(max-width:430px) 100vw,430px"
                preload
              />
              <Link
                className={`${styles.back} ${styles.heroBack}`}
                href={backHref}
                aria-label="Back"
              >
                <DetailIcon name="back" />
              </Link>
            </div>
          ) : (
            <header className={styles.header}>
              <Link className={styles.back} href={backHref} aria-label="Back">
                <DetailIcon name="back" />
              </Link>
              <p>{place.district}</p>
            </header>
          )}
          <section
            className={styles.editorialPanel}
            aria-label="Overview tempat"
          >
            <p className={styles.eyebrow}>
              {place.category.replaceAll("_", " ")} / {place.district}
            </p>
            <h1 className={styles.name}>{place.name}</h1>
            {place.rating !== null ? (
              <div className={styles.rating}>
                <strong>{place.rating.toFixed(1)}</strong>
                <div>
                  <b>
                    {place.reviewCount?.toLocaleString("id-ID")} Google ratings
                  </b>
                </div>
              </div>
            ) : (
              <p className={styles.supporting}>
                Rating Google belum tersimpan.
              </p>
            )}
            <p className={styles.address}>
              {place.address ??
                `Alamat lengkap belum tersedia. Titik peta tersedia di ${place.district}.`}
            </p>
            <OpeningHours place={place} />
            <nav className={styles.sections} aria-label="Restaurant sections">
              {[
                ["overview", "Overview"],
                ["menu", "Menu"],
                ["reviews", "Reviews"],
              ].map(([value, label]) => {
                const params = new URLSearchParams(context);
                if (value !== "overview") params.set("tab", value!);
                return (
                  <Link
                    key={value}
                    href={`${catalogDetailHref(place)}${params.size ? `?${params}` : ""}`}
                    aria-current={tab === value ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            {tab === "reviews" ? (
              <section aria-label="Reviews tempat">
                <h2>Reviews</h2>
                {reviews.length ? (
                  reviews.map((review) => (
                    <article className={styles.review} key={review.author_url}>
                      <b>
                        <a
                          href={review.author_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {review.author}
                        </a>{" "}
                        · {review.rating}/5
                      </b>
                      <blockquote>{review.excerpt}</blockquote>
                    </article>
                  ))
                ) : (
                  <p className={styles.supporting}>
                    Ulasan belum tersimpan untuk tempat ini.
                  </p>
                )}
              </section>
            ) : tab === "menu" ? (
              <section aria-label="Menu dari Google reviews">
                <h2>Menu</h2>
                {place.menuPhotos.length ? (
                  <div className={menuStyles.menuGrid}>
                    {place.menuPhotos.map((photo) => (
                      <figure key={photo.photoPath}>
                        <a
                          href={photo.photoPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Lihat foto ${photo.name}`}
                        >
                          <RestaurantPhoto
                            src={photo.photoPath}
                            alt={photo.name}
                            className={menuStyles.menuPhoto}
                            sizes="190px"
                          />
                        </a>
                        <figcaption>{photo.name}</figcaption>
                        <a
                          className={menuStyles.sourceLink}
                          href={photo.authorUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {photo.author} · Google
                        </a>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className={styles.supporting}>
                    Menu dan harga belum tersimpan untuk tempat ini.
                  </p>
                )}
              </section>
            ) : (
              <section aria-label="Tentang tempat">
                <h2>Overview</h2>
                <p className={styles.supporting}>
                  {place.description ??
                    `${place.name} berada di ${place.district}, ${place.city}.`}
                  {place.cuisine ? ` Pilihan masakan: ${place.cuisine}.` : ""}
                </p>
              </section>
            )}
            <a
              className={`${styles.action} ${styles.primary}`}
              href={place.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <DetailIcon name="external-white" />
              Buka Google Maps
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
