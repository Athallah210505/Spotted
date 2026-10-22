"use client";

import Image from "next/image";
import { AccountIcon } from "@/features/profile/account-icon";
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
  selectedId,
  onSelect,
}: {
  places: DemoRestaurant[];
  savedIds: string[];
  radius: number;
  wishlist: boolean;
  city: "jakarta" | "tangsel";
  onLocate: () => void;
  selectedId?: string;
  onSelect: (id: string, button: HTMLButtonElement) => void;
}) {
  return (
    <div
      className={styles.map}
      role="region"
      aria-label="Illustrative restaurant map"
    >
      <Image
        className={styles.streets}
        src="/figma/editorial/map-geography.svg"
        width={390}
        height={518}
        alt=""
        aria-hidden="true"
      />
      <p className={styles.areaTop}>
        {city === "jakarta" ? "BLOK M" : "BINTARO"}
      </p>
      <p className={styles.areaMiddle}>
        {city === "jakarta" ? "CIPETE" : "TANGSEL"}
      </p>
      <p className={styles.areaBottom}>
        {city === "jakarta" ? "JAKARTA SELATAN" : "TANGERANG SELATAN"}
      </p>
      <span className={styles.srOnly}>
        {wishlist ? "Saved places" : "Restaurants"} within {radius} km of the
        sample location
      </span>
      {places.map((place) => {
        const saved = savedIds.includes(place.id);
        const nearby = city === "jakarta" && place.distanceM <= radius * 1000;
        return (
          <button
            key={place.id}
            onClick={(event) => onSelect(place.id, event.currentTarget)}
            data-place-id={place.id}
            aria-pressed={selectedId === place.id}
            className={`${styles.marker} ${positions[place.id]} ${selectedId === place.id ? styles.selectedMarker : saved ? (nearby ? styles.nearbyMarker : styles.savedMarker) : styles.regularMarker}`}
            aria-label={`Preview ${place.name}, ${saved ? (nearby ? "saved nearby" : "saved") : "not saved"}, rating ${place.rating}`}
          >
            {selectedId === place.id ? (
              <AccountIcon name="bookmark-white" />
            ) : (
              <BrowseIcon name={saved ? "bookmark" : "pin"} source="maps" />
            )}
            <span>
              {selectedId !== place.id && saved
                ? nearby
                  ? "Nearby · "
                  : "Saved · "
                : ""}
              {place.rating}
            </span>
          </button>
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
