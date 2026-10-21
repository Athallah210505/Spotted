"use client";

import Image from "next/image";
import Link from "next/link";
import { JourneyLayout } from "@/features/tiktok/journey-layout";
import { DetailIcon } from "@/features/restaurants/detail-icon";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import type { DemoRestaurant } from "@/features/restaurants/demo-data";
import shared from "@/components/layout/browse.module.css";
import styles from "@/features/tiktok/journey.module.css";
import { usePreviewWishlist } from "./preview-wishlist";

export function SavedPage({
  place,
  restaurantHref,
}: {
  place: DemoRestaurant;
  restaurantHref: string;
}) {
  const { savedIds } = usePreviewWishlist();
  if (!savedIds.includes(place.id))
    return (
      <JourneyLayout title="Your Wishlist" backHref={restaurantHref}>
        <h1>This spot is no longer saved.</h1>
        <p className={`${styles.body} ${styles.muted}`}>
          Return to the restaurant to save it again in this preview.
        </p>
        <Link
          className={`${styles.action} ${styles.yellow}`}
          href={restaurantHref}
        >
          Back to restaurant
        </Link>
      </JourneyLayout>
    );
  return (
    <JourneyLayout title="Saved to Wishlist" backHref={restaurantHref}>
      <div role="status" className={styles.savedNotice}>
        <Image src="/figma/journey/check.svg" width={24} height={24} alt="" />
        <span>Saved to your wishlist</span>
      </div>
      <h1>
        One for
        <br />
        your food plans.
      </h1>
      <Link
        href={restaurantHref}
        className={`${shared.card} ${shared.cardOpen}`}
        aria-label={`View ${place.name}`}
      >
        <RestaurantPhoto
          src={`/figma/explore/${place.image}`}
          alt={place.imageAlt}
          sizes="(max-width: 430px) 90vw, 390px"
          className={shared.photo}
        />
        <div className={shared.cardContent}>
          <h2 className={shared.restaurantName}>{place.name}</h2>
          <p className={shared.rating}>
            {place.rating} · Google ({place.ratingCount})
            <span className={shared.ratingDivider}>/</span>
            {place.category}
          </p>
          <p className={shared.supporting}>
            {place.area} · {place.distanceLabel} ·{" "}
            {"Rp".repeat(place.priceLevel ?? 2)}
          </p>
        </div>
        <span
          className={styles.savedMark}
          aria-label="Saved in preview wishlist"
        >
          <Image src="/figma/journey/check.svg" width={24} height={24} alt="" />
        </span>
      </Link>
      <Link
        className={`${styles.action} ${styles.yellow}`}
        href={`/wishlist?city=${place.city}`}
      >
        <DetailIcon name="bookmark" />
        <span>View Wishlist</span>
      </Link>
      <Link href={restaurantHref} className={styles.action}>
        Back to restaurant
      </Link>
      <p className={styles.caption}>Preview wishlist · this visit only.</p>
    </JourneyLayout>
  );
}
