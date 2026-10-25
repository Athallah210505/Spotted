import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import { catalogPhotos } from "./catalog-media";
import styles from "./catalog.module.css";

export function CatalogPhoto({
  placeId,
  mapsUrl,
  preload = false,
  children,
}: {
  placeId: string;
  mapsUrl: string;
  preload?: boolean;
  children?: React.ReactNode;
}) {
  const photo = catalogPhotos[placeId];
  if (!photo) return null;
  return (
    <figure className={styles.figure}>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${photo.alt} · buka lokasi di Google Maps`}
      >
        <RestaurantPhoto
          src={photo.src}
          alt={photo.alt}
          className={styles.photo}
          sizes="(max-width: 430px) calc(100vw - 48px), 382px"
          preload={preload}
        />
      </a>
      {children}
      <figcaption className={styles.credit}>
        <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">
          Foto: {photo.author}
        </a>{" "}
        ·{" "}
        <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">
          {photo.license}
        </a>
        <span>{photo.note}</span>
      </figcaption>
    </figure>
  );
}
