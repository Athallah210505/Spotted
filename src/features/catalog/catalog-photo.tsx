import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import Link from "next/link";
import { catalogPhotos } from "./catalog-media";
import styles from "./catalog.module.css";

export function CatalogPhoto({
  placeId,
  href,
  preload = false,
  children,
}: {
  placeId: string;
  href?: string;
  preload?: boolean;
  children?: React.ReactNode;
}) {
  const photo = catalogPhotos[placeId];
  if (!photo) return null;
  const image = (
    <RestaurantPhoto
      src={photo.src}
      alt={photo.alt}
      className={styles.photo}
      sizes="(max-width: 430px) calc(100vw - 48px), 382px"
      preload={preload}
    />
  );
  return (
    <figure className={styles.figure}>
      {href ? (
        <Link href={href} aria-label={`${photo.alt} · lihat detail`}>
          {image}
        </Link>
      ) : (
        image
      )}
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
