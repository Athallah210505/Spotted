"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import type { DemoRestaurant } from "./demo-data";
import { DetailIcon } from "./detail-icon";
import { RestaurantPhoto } from "./restaurant-photo";
import styles from "./restaurant-detail.module.css";

type Section = "menu" | "reviews" | "tiktok";
type Notice = "menu" | "directions" | "reviews";
const messages = {
  menu: [
    "Official menu unavailable",
    "This preview has no verified menu URL. The sample prices are illustrative.",
  ],
  directions: [
    "Directions unavailable",
    "This is an illustrative restaurant and address. You can explore the real area in Google Maps.",
  ],
  reviews: [
    "Live reviews unavailable",
    "The review shown here is illustrative. No Google place is linked yet. You can explore the real area in Google Maps.",
  ],
} as const;

export function RestaurantDetail({
  place,
  tab,
  backHref,
  backLabel,
  sectionHrefs,
  saveAction,
  heroSaveAction,
  personalVideo,
}: {
  place: DemoRestaurant;
  tab: Section;
  backHref: string;
  backLabel: string;
  sectionHrefs: Record<Section, string>;
  saveAction: React.ReactNode;
  heroSaveAction: React.ReactNode;
  personalVideo: React.ReactNode;
}) {
  const isRamen = place.id === "kedai-ramen-sore";
  const photos = isRamen
    ? [
        {
          src: "/figma/editorial/ramen.png",
          alt: "Illustrative ramen bowl with egg and vegetables",
        },
        {
          src: "/figma/editorial/sushi.png",
          alt: "Illustrative sushi platter from the Figma gallery",
        },
        {
          src: "/figma/editorial/dessert.png",
          alt: "Illustrative dessert from the Figma gallery",
        },
      ]
    : [{ src: `/figma/explore/${place.image}`, alt: place.imageAlt }];
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photos[photoIndex]!;
  const [notice, setNotice] = useState<Notice>("menu");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const area =
    place.city === "jakarta"
      ? `${place.area}, Jakarta Selatan`
      : `${place.area}, Tangerang Selatan`;
  const areaUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`restaurants in ${area}`)}`;

  function explain(kind: Notice, button: HTMLButtonElement) {
    trigger.current = button;
    setNotice(kind);
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }

  function rating() {
    return (
      <div
        className={styles.rating}
        aria-label={`${place.rating} Google rating from ${place.ratingCount} illustrative ratings`}
      >
        <strong>{place.rating}</strong>
        <div>
          <b>{place.ratingCount} Google ratings</b>
          <p className={styles.open}>
            {isRamen
              ? `Open until 22:00 · ${place.distanceLabel}`
              : `Hours unavailable · ${place.distanceLabel}`}
          </p>
        </div>
      </div>
    );
  }

  function sections() {
    return (
      <nav className={styles.sections} aria-label="Restaurant sections">
        {(
          [
            ["menu", "Menu"],
            ["reviews", "Google Reviews"],
            ["tiktok", "TikTok"],
          ] as const
        ).map(([value, label]) => (
          <Link
            key={value}
            href={sectionHrefs[value]}
            aria-label={label}
            aria-current={tab === value ? "page" : undefined}
          >
            {value === "reviews" ? "Reviews" : label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div
      className={`${styles.shell} ${tab === "menu" ? styles.menuShell : ""}`}
    >
      <a className={styles.skipLink} href="#restaurant-content">
        Skip to restaurant details
      </a>
      <div className={styles.safeArea}>
        <Link
          className={styles.locate}
          href={backHref}
          aria-label={`Change area in ${backLabel.replace("Back to ", "")}`}
        >
          <DetailIcon name="locate" />
        </Link>
      </div>
      <main className={styles.scrollArea} id="restaurant-content" tabIndex={-1}>
        <div className={styles.content}>
          {tab !== "menu" ? (
            <header className={styles.header}>
              <Link
                className={styles.back}
                href={sectionHrefs.menu}
                aria-label="Back to restaurant"
              >
                <DetailIcon name="back" />
              </Link>
              <h1>{place.name}</h1>
            </header>
          ) : null}
          {tab === "menu" ? (
            <>
              <div className={styles.heroWrap}>
                <RestaurantPhoto
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  className={styles.hero}
                  sizes="(max-width: 430px) 100vw, 430px"
                  preload
                />
                <Link
                  className={`${styles.back} ${styles.heroBack}`}
                  href={backHref}
                  aria-label={backLabel}
                >
                  <DetailIcon name="back" />
                </Link>
                {heroSaveAction}
                <div
                  className={styles.gallery}
                  aria-label="Restaurant photo gallery"
                >
                  <button
                    onClick={() =>
                      setPhotoIndex(
                        (index) => (index - 1 + photos.length) % photos.length,
                      )
                    }
                    disabled={photos.length === 1}
                  >
                    <DetailIcon name="previous" />
                    <span>Previous</span>
                  </button>
                  <p role="status" aria-live="polite">
                    {photoIndex + 1} / {photos.length}
                  </p>
                  <button
                    onClick={() =>
                      setPhotoIndex((index) => (index + 1) % photos.length)
                    }
                    disabled={photos.length === 1}
                  >
                    <DetailIcon name="arrow" />
                    <span>Next photo</span>
                  </button>
                </div>
              </div>
              <section
                className={styles.editorialPanel}
                aria-label="Restaurant information"
              >
                <p className={styles.eyebrow}>
                  {place.category.toUpperCase()} / {place.area.toUpperCase()}
                </p>
                <h1 className={styles.name}>
                  {isRamen ? (
                    <>
                      Kedai Ramen
                      <br />
                      Sore
                    </>
                  ) : (
                    place.name
                  )}
                </h1>
                {rating()}
                <p className={styles.address}>
                  {isRamen
                    ? "Jl. Contoh No. 12, Jakarta Selatan"
                    : `Address unavailable · ${area}`}
                </p>
                {sections()}
                <h2>
                  {isRamen ? "A taste of what’s here." : "Illustrative photos."}
                </h2>
                {isRamen ? (
                  <div className={styles.photoRail}>
                    {photos.slice(1).map((item) => (
                      <RestaurantPhoto
                        key={item.src}
                        src={item.src}
                        alt={item.alt}
                        className={styles.menuPhoto}
                        sizes="(max-width: 430px) 43vw, 185px"
                      />
                    ))}
                  </div>
                ) : (
                  <p className={styles.supporting}>
                    No verified menu is available for this preview.
                  </p>
                )}
                <p className={styles.caption}>
                  Photos and restaurant information are illustrative. Halal
                  status has not been verified.
                </p>
                {isRamen ? (
                  <div className={styles.menuCard}>
                    <dl>
                      <div>
                        <dt>Shoyu ramen</dt>
                        <dd>Rp58.000</dd>
                      </div>
                      <div>
                        <dt>Vegetable gyoza</dt>
                        <dd>Rp32.000</dd>
                      </div>
                    </dl>
                    <p className={styles.caption}>
                      Illustrative menu · not an official price list
                    </p>
                  </div>
                ) : null}
                <button
                  className={styles.action}
                  onClick={(event) => explain("menu", event.currentTarget)}
                >
                  <DetailIcon name="external" />
                  <span>Open official menu</span>
                </button>
                <p className={styles.caption}>
                  Speciality unavailable: no verified source.
                  <br />
                  Photos shown are illustrative Unsplash photography.
                </p>
              </section>
            </>
          ) : tab === "reviews" ? (
            <>
              {rating()}
              {sections()}
              {isRamen ? (
                <article
                  className={styles.review}
                  aria-label="Illustrative review by Alya"
                >
                  <b>Alya · 4 / 5</b>
                  <blockquote>
                    “Warm broth and a comfortable little corner.”
                  </blockquote>
                  <p className={styles.caption}>
                    Illustrative review · not live Google data
                  </p>
                </article>
              ) : (
                <p className={styles.supporting}>
                  No verified reviews are available for this preview.
                </p>
              )}
              <p className={styles.supporting}>
                Only a limited selection is available here.
              </p>
              <button
                className={`${styles.action} ${styles.primary}`}
                onClick={(event) => explain("reviews", event.currentTarget)}
              >
                <DetailIcon name="external-white" />
                <span>See all on Google Maps</span>
              </button>
              <p className={styles.caption}>
                Production reviews must retain author name, source, attribution
                and supplied links.{" "}
                {isRamen
                  ? "This review is explicitly illustrative."
                  : "Live Google reviews are not connected."}
              </p>
            </>
          ) : (
            <>
              {sections()}
              <h2>From your saved links</h2>
              {personalVideo}
              <h2>Public restaurant videos</h2>
              <div className={styles.empty}>
                <DetailIcon name="search" />
                <h3>Not available yet</h3>
                <p className={styles.muted}>
                  We’ll show verified information when available.
                </p>
                <Link
                  className={`${styles.action} ${styles.yellow}`}
                  href={sectionHrefs.menu}
                >
                  Back to restaurant
                </Link>
              </div>
              <p className={styles.supporting}>
                No approved videos yet. Your imports are not automatically
                published.
              </p>
            </>
          )}
        </div>
      </main>
      <footer className={styles.dock}>
        {tab === "menu" ? (
          <div className={styles.actions}>
            {saveAction}
            <button
              className={`${styles.action} ${styles.primary}`}
              onClick={(event) => explain("directions", event.currentTarget)}
            >
              <DetailIcon name="external-white" />
              <span>Get Directions</span>
            </button>
          </div>
        ) : null}
        <p className={styles.demoLabel}>Illustrative data</p>
      </footer>
      <dialog
        className={styles.dialog}
        ref={dialog}
        aria-labelledby="detail-dialog-title"
        onClose={() => trigger.current?.focus()}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "button, a[href]",
            ),
          );
          event.preventDefault();
          const index = controls.indexOf(document.activeElement as HTMLElement);
          controls[
            (index + (event.shiftKey ? -1 : 1) + controls.length) %
              controls.length
          ]?.focus();
        }}
      >
        <button
          className={styles.closeDialog}
          aria-label="Close dialog"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <h2 id="detail-dialog-title">{messages[notice][0]}</h2>
        <p>{messages[notice][1]}</p>
        {notice === "directions" || notice === "reviews" ? (
          <a
            className={`${styles.action} ${styles.primary}`}
            href={areaUrl}
            target="_blank"
            rel="noreferrer"
          >
            Explore {place.area} in Google Maps
          </a>
        ) : null}
      </dialog>
    </div>
  );
}
