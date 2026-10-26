"use client";
import Link from "next/link";
import Image from "next/image";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";
import { areaNames, openingLabel, type GooglePlace } from "./google-data";
import { catalogDetailHref } from "./catalog-media";
import styles from "@/components/layout/browse.module.css";
import googleStyles from "./google-ui.module.css";

export function GooglePlaceCard({
  place,
  preload = false,
  search = "",
  featured = false,
}: {
  place: GooglePlace;
  preload?: boolean;
  search?: string;
  featured?: boolean;
}) {
  const { savedIds, toggle } = usePreviewWishlist();
  const saved = savedIds.includes(place.id);
  return (
    <article
      className={`${styles.card} ${googleStyles.card}`}
      aria-label={place.name}
    >
      <Link
        className={styles.cardOpen}
        href={`${catalogDetailHref(place)}${search ? `?${search}` : ""}`}
        aria-label={`View ${place.name}`}
      >
        <RestaurantPhoto
          src={place.photoPath}
          alt={place.name}
          className={`${styles.photo} ${googleStyles.cardPhoto}`}
          sizes="(max-width: 430px) calc(100vw - 48px), 382px"
          preload={preload}
        />
        {featured ? (
          <span className={googleStyles.editorialLabel}>THE LOCAL EDIT</span>
        ) : null}
        <div className={`${styles.cardContent} ${googleStyles.cardContent}`}>
          <div className={styles.cardIdentity}>
            <h3 className={styles.restaurantName}>
              {place.name.replaceAll("Blok M", "Blok\u00a0M")}
            </h3>
            <p className={styles.supporting}>
              {place.category} · {areaNames[place.area]}
            </p>
            {place.hours.length ? (
              <p className={styles.supporting}>{openingLabel(place)}</p>
            ) : null}
          </div>
          <p
            className={styles.rating}
            aria-label={`${place.rating} Google rating from ${place.reviewCount} reviews`}
          >
            <strong>{place.rating.toFixed(1)}</strong>
            <span>Google</span>
          </p>
        </div>
      </Link>
      <button
        className={`${styles.saveButton} ${googleStyles.saveButton}`}
        aria-label={`${saved ? "Remove" : "Save"} ${place.name}${saved ? " from" : " to"} wishlist`}
        aria-pressed={saved}
        onClick={() => toggle(place.id)}
      >
        <Image
          src="/figma/editorial/bookmark.svg"
          width={22}
          height={22}
          alt=""
        />
      </button>
    </article>
  );
}
