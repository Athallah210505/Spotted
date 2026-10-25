import { catalogRatings } from "./catalog-media";
import styles from "./catalog.module.css";

export function CatalogRating({ placeId }: { placeId: string }) {
  const rating = catalogRatings[placeId];
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
      <span>
        {rating ? `${rating.provider} · snapshot` : "Belum ada rating"}
      </span>
    </div>
  );
}
