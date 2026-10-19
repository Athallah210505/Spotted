"use client";

import Image from "next/image";
import Link from "next/link";
import { BrowseIcon } from "@/components/layout/browse-icon";
import type { DemoRestaurant } from "@/features/restaurants/demo-data";
import styles from "./discovery.module.css";

const positions: Record<string, string | undefined> = {
  "kedai-ramen-sore": styles.pinTop,
  "kopi-halaman": styles.pinBottom,
  "ruang-matcha": styles.pinLeft,
};

export function SchematicMap({
  places,
  savedIds,
  radius,
  wishlist,
  city,
  onLocate,
  detailHref,
}: {
  places: DemoRestaurant[];
  savedIds: string[];
  radius: number;
  wishlist: boolean;
  city: "jakarta" | "tangsel";
  onLocate: () => void;
  detailHref: (id: string) => string;
}) {
  return (
    <div
      className={styles.map}
      role="region"
      aria-label="Illustrative restaurant map"
    >
      <div className={styles.streets} aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            key={index}
            className={`${styles.street} ${index % 2 ? styles.streetUp : styles.streetDown}`}
            style={{
              top: index % 2 ? -32 + (index - 1) * 64 : 58 + index * 64,
            }}
          />
        ))}
      </div>
      <p className={styles.areaTop}>
        {city === "jakarta" ? "BLOK M" : "BINTARO"}
      </p>
      <p className={styles.areaMiddle}>
        {city === "jakarta" ? "CIPETE" : "TANGSEL"}
      </p>
      <p className={styles.areaBottom}>
        {city === "jakarta" ? "JAKARTA SELATAN" : "TANGERANG SELATAN"}
      </p>
      {wishlist ? (
        <Image
          className={styles.radiusOverlay}
          src="/figma/maps/radius.png"
          width={280}
          height={280}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      {places.map((place) => {
        const saved = savedIds.includes(place.id);
        const nearby = city === "jakarta" && place.distanceM <= radius * 1000;
        return (
          <Link
            key={place.id}
            href={detailHref(place.id)}
            className={`${styles.marker} ${positions[place.id]} ${saved ? (nearby ? styles.nearbyMarker : styles.savedMarker) : styles.regularMarker}`}
            aria-label={`View ${place.name}, ${saved ? (nearby ? "saved nearby" : "saved") : "not saved"}, rating ${place.rating}`}
          >
            <BrowseIcon name={saved ? "bookmark" : "pin"} source="maps" />
            <span>
              {saved ? (nearby ? "Nearby · " : "Saved · ") : ""}
              {place.rating}
            </span>
          </Link>
        );
      })}
      <button
        className={styles.recenter}
        onClick={onLocate}
        aria-label="Use current location"
      >
        <BrowseIcon name="locate" source="maps" />
      </button>
    </div>
  );
}
