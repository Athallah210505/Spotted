"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  demoRestaurants,
  findDemoRestaurant,
} from "@/features/restaurants/demo-data";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import { DetailIcon } from "@/features/restaurants/detail-icon";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";
import { JourneyLayout } from "./journey-layout";
import { RecommendationCard } from "./recommendation-card";
import { parseTikTokUrl } from "./tiktok-url";
import styles from "./journey.module.css";

export function ImportPage({ step }: { step: "link" | "confirm" | "success" }) {
  const router = useRouter();
  const {
    importDraft,
    setImportDraft,
    savedIds,
    savedVideos,
    lastImport,
    previewSignedIn,
    saveRecommendation,
  } = usePreviewWishlist();
  const [urlInput, setUrlInput] = useState(importDraft.url);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const place = findDemoRestaurant(importDraft.placeId);
  const validUrl = parseTikTokUrl(importDraft.url);

  if (step === "success") {
    const saved = lastImport ? findDemoRestaurant(lastImport) : undefined;
    if (!saved || !savedIds.includes(saved.id) || !savedVideos[saved.id])
      return (
        <JourneyLayout title="Save a recommendation" navigation>
          <h1>No saved import in this visit.</h1>
          <p className={`${styles.body} ${styles.muted}`}>
            Preview imports reset when you reload. Add a TikTok link to start
            again.
          </p>
          <Link className={`${styles.action} ${styles.yellow}`} href="/import">
            Add a TikTok link
          </Link>
        </JourneyLayout>
      );
    return (
      <JourneyLayout navigation>
        <div className={styles.check}>
          <Image src="/figma/journey/check.svg" width={24} height={24} alt="" />
        </div>
        <h1>
          Craving
          <br />
          remembered.
        </h1>
        <p className={`${styles.body} ${styles.muted}`}>
          {saved.name} and your TikTok link are saved in this preview for this
          visit only.
        </p>
        <RecommendationCard place={saved} />
        <Link
          className={`${styles.action} ${styles.yellow}`}
          href={`/wishlist?city=${saved.city}`}
        >
          <DetailIcon name="bookmark" />
          <span>Open Wishlist</span>
        </Link>
        <Link
          className={styles.action}
          href={`/map?city=${saved.city}&place=${saved.id}`}
        >
          <Image src="/figma/journey/map.svg" width={20} height={20} alt="" />
          <span>Find it on the map</span>
        </Link>
      </JourneyLayout>
    );
  }

  return (
    <JourneyLayout
      title={step === "link" ? "Add from TikTok" : "Choose the restaurant"}
      backHref={step === "link" ? "/wishlist" : "/import"}
      navigation
      masthead={
        step === "link" ? (
          <>
            <p className={styles.caption}>KEEP A GOOD FIND</p>
            <h1>
              Saw it.
              <br />
              Save it.
            </h1>
          </>
        ) : undefined
      }
    >
      {step === "link" ? (
        <>
          <form
            className={styles.form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const url = parseTikTokUrl(urlInput);
              if (!url) {
                setError(
                  "Enter an HTTPS TikTok video or vm.tiktok.com / vt.tiktok.com share link.",
                );
                return;
              }
              setImportDraft({
                url,
                placeId: importDraft.url === url ? importDraft.placeId : "",
              });
              router.push("/import?step=confirm");
            }}
          >
            <label className={styles.label} htmlFor="tiktok-url">
              TikTok video link
            </label>
            <input
              id="tiktok-url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              maxLength={2048}
              required
              value={urlInput}
              onChange={(event) => {
                setUrlInput(event.target.value);
                setError("");
              }}
              className={styles.input}
              placeholder="Paste a public TikTok video link"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "link-error" : "link-help"}
            />
            {error ? (
              <p role="alert" id="link-error" className={styles.error}>
                {error}
              </p>
            ) : null}
            <p id="link-help" className={styles.caption}>
              Example: tiktok.com/@creator/video/…
            </p>
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className={`${styles.action} ${styles.yellow}`}
            >
              <Image
                src="/figma/editorial/arrow.svg"
                width={20}
                height={20}
                alt=""
              />
              <span>Find the restaurant</span>
            </button>
          </form>
          <div className={styles.privateNotice}>
            <b>Your links stay private.</b>
            <p>
              Choose the restaurant before saving.
              <br />
              Nothing is posted to TikTok.
            </p>
          </div>
          <p className={`${styles.body} ${styles.muted}`}>
            Can’t open a video? You can still choose the restaurant and keep the
            link.
          </p>
          <p className={styles.caption}>
            This preview keeps links in app memory only. Videos are not fetched
            or identified automatically.
          </p>
        </>
      ) : (
        <>
          <h1>
            Make it your
            <br />
            next stop.
          </h1>
          <p className={`${styles.body} ${styles.muted}`}>
            Confirm the place shown in the video.
          </p>
          <div className={styles.linkReady}>
            <p className={styles.caption}>LINK READY</p>
            <b>
              {validUrl
                ? "Your TikTok video link is attached."
                : "Add your link before saving. No video was imported."}
            </b>
          </div>
          <label className={styles.restaurantSearch}>
            <Image
              src="/figma/editorial/search.svg"
              width={20}
              height={20}
              alt=""
            />
            <input
              type="search"
              aria-label="Search restaurant or area"
              placeholder="Search restaurant or area"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div
            className={styles.choices}
            role="group"
            aria-label="Choose a restaurant"
          >
            {demoRestaurants
              .filter((item) =>
                `${item.name} ${item.area}`
                  .toLowerCase()
                  .includes(query.toLowerCase().trim()),
              )
              .map((item) => (
                <button
                  key={item.id}
                  className={`${styles.card} ${styles.restaurantChoice}`}
                  aria-pressed={place?.id === item.id}
                  onClick={() =>
                    setImportDraft({ ...importDraft, placeId: item.id })
                  }
                >
                  <RestaurantPhoto
                    src={`/figma/explore/${item.image}`}
                    alt={item.imageAlt}
                    sizes="80px"
                    className={styles.photo}
                  />
                  <div className={styles.details}>
                    <h2>{item.name}</h2>
                    <p>
                      {item.rating} · Google ({item.ratingCount})
                    </p>
                    <p className={styles.blue}>
                      {item.area} · {item.category}
                    </p>
                  </div>
                </button>
              ))}
            {!demoRestaurants.some((item) =>
              `${item.name} ${item.area}`
                .toLowerCase()
                .includes(query.toLowerCase().trim()),
            ) ? (
              <p className={styles.body}>
                No places found. Try another restaurant or area.
              </p>
            ) : null}
          </div>
          <button
            disabled={!place || !validUrl}
            className={`${styles.action} ${styles.yellow}`}
            onClick={() => {
              if (!place || !validUrl) return;
              if (!previewSignedIn) {
                router.push("/login?from=import");
                return;
              }
              saveRecommendation();
              router.push("/import/success");
            }}
          >
            <DetailIcon name="bookmark" />
            <span>
              {place ? "Save to Wishlist" : "Select a restaurant to continue"}
            </span>
          </button>
          <p className={styles.caption}>
            A link is saved only after you confirm a restaurant.
          </p>
          {validUrl ? (
            <a
              className={styles.action}
              href={validUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch on TikTok
            </a>
          ) : (
            <Link className={styles.action} href="/import">
              Add a TikTok link
            </Link>
          )}
          <Link className={styles.caption} href="/import">
            Edit TikTok link
          </Link>
        </>
      )}
    </JourneyLayout>
  );
}
