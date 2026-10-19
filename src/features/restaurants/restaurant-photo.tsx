"use client";

import Image from "next/image";
import { useState } from "react";

import styles from "./restaurant-photo.module.css";

export function RestaurantPhoto({
  src,
  alt,
  className,
  sizes,
  preload = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  preload?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={className}>
      {failed ? (
        <span
          className={styles.fallback}
          role="img"
          aria-label="Photo unavailable"
        >
          Photo unavailable
        </span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className={styles.image}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
