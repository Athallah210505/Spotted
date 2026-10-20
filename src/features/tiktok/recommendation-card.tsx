import Link from "next/link";
import type { DemoRestaurant } from "@/features/restaurants/demo-data";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import styles from "./journey.module.css";

export function RecommendationCard({ place }: { place: DemoRestaurant }) {
  return (
    <Link href={`/restaurant/${place.id}?tab=tiktok`} className={styles.card}>
      <RestaurantPhoto
        src={`/figma/explore/${place.image}`}
        alt={place.imageAlt}
        sizes="88px"
        className={styles.photo}
      />
      <div className={styles.details}>
        <h2>{place.name}</h2>
        <p>
          {place.rating} · Google ({place.ratingCount})
        </p>
        <p className={styles.muted}>
          {place.category} · {place.area} · {place.distanceLabel}
        </p>
      </div>
    </Link>
  );
}
