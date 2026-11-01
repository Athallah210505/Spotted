"use client";
import Link from "next/link";
import Image from "next/image";
import type { FoodPlace } from "./food-types";
import { googlePlaces } from "./google-data";
import { GooglePlaceCard } from "./google-place-card";
import { catalogDetailHref } from "./catalog-media";
import styles from "./food-place.module.css";

export function FoodPlaceCard({
  place,
  search = "",
  preload = false,
  featured = false,
}: {
  place: FoodPlace;
  search?: string;
  preload?: boolean;
  featured?: boolean;
}) {
  const published = googlePlaces.find((p) => p.id === place.id);
  if (published)
    return (
      <GooglePlaceCard
        place={published}
        search={search}
        preload={preload}
        featured={featured}
      />
    );
  return (
    <article className={styles.card} aria-label={place.name}>
      <Link
        href={`${catalogDetailHref(place)}${search ? `?${search}` : ""}`}
        aria-label={`View ${place.name}`}
      >
        <div className={styles.identity}>
          <p>
            {place.district} · {place.city}
          </p>
          <h3>{place.name}</h3>
          <span>
            {place.cuisine.replaceAll("_", " ") ||
              place.category.replaceAll("_", " ")}
          </span>
        </div>
        {place.rating !== null ? (
          <div
            className={styles.rating}
            aria-label={`${place.rating} Google rating`}
          >
            <strong>{place.rating.toFixed(1)}</strong>
            <span>Google</span>
          </div>
        ) : null}
        <div className={styles.bottom}>
          <span>
            {place.rating === null
              ? "Rating belum tersedia"
              : place.reviewCount === null
                ? "Rating Google tersedia"
                : `${place.reviewCount.toLocaleString("id-ID")} ulasan`}
          </span>
          <Image
            src="/figma/editorial/back.svg"
            width={18}
            height={18}
            alt=""
          />
        </div>
      </Link>
    </article>
  );
}
