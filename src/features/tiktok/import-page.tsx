"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PreviewDialog } from "@/components/ui/preview-dialog";
import {
  demoRestaurants,
  findDemoRestaurant,
} from "@/features/restaurants/demo-data";
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
  const place = findDemoRestaurant(importDraft.placeId) ?? demoRestaurants[0]!;
  const [error, setError] = useState("");
  const [choosing, setChoosing] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const validUrl = parseTikTokUrl(importDraft.url);
  if (step === "success") {
    const saved = lastImport ? findDemoRestaurant(lastImport) : undefined;
    if (!saved || !savedIds.includes(saved.id) || !savedVideos[saved.id])
      return (
        <JourneyLayout title="Save a recommendation">
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
      <JourneyLayout>
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
      title={
        step === "confirm"
          ? "Confirm your recommendation"
          : "Save a TikTok recommendation"
      }
      backHref="/wishlist"
    >
      {step === "link" ? (
        <>
          <p className={styles.step}>STEP 1 OF 3</p>
          <h1>
            Keep the link.
            <br />
            Choose the place.
          </h1>
          <p className={`${styles.body} ${styles.muted}`}>
            Paste a TikTok video link and select a sample restaurant. This
            preview does not identify restaurants or fetch videos.
          </p>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              const url = parseTikTokUrl(
                String(new FormData(event.currentTarget).get("url") ?? ""),
              );
              if (!url) {
                setError(
                  "Enter an HTTPS TikTok video or vm.tiktok.com / vt.tiktok.com share link.",
                );
                return;
              }
              setImportDraft({ ...importDraft, url });
              router.push("/import?step=confirm");
            }}
            noValidate
          >
            <label htmlFor="tiktok-url" className={styles.label}>
              TikTok video link
            </label>
            <input
              className={styles.input}
              id="tiktok-url"
              name="url"
              type="url"
              inputMode="url"
              autoComplete="off"
              maxLength={2048}
              defaultValue={importDraft.url}
              placeholder="https://www.tiktok.com/@creator/video/…"
              required
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "link-error" : "link-help"}
            />
            {error ? (
              <p role="alert" id="link-error" className={styles.error}>
                {error}
              </p>
            ) : null}
            <p id="link-help" className={styles.caption}>
              Links stay in app memory. Nothing is fetched or published; share
              links are not resolved.
            </p>
            <label className={styles.label} htmlFor="restaurant">
              Restaurant
            </label>
            <select
              id="restaurant"
              className={styles.input}
              value={place.id}
              onChange={(event) =>
                setImportDraft({ ...importDraft, placeId: event.target.value })
              }
            >
              {demoRestaurants.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name} · {item.area}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className={`${styles.action} ${styles.yellow}`}
            >
              Confirm recommendation
            </button>
          </form>
        </>
      ) : (
        <>
          <p className={styles.step}>STEP 3 OF 3</p>
          <h1>
            Right place.
            <br />
            Saved inspiration.
          </h1>
          <RecommendationCard place={place} />
          <article className={styles.video}>
            <DetailIcon name="video" />
            <h2>Saved food recommendation</h2>
            <p>Only this open app holds your linked video.</p>
            {validUrl ? (
              <a
                className={styles.action}
                href={validUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DetailIcon name="external" />
                <span>Watch on TikTok</span>
              </a>
            ) : (
              <Link href="/import" className={styles.action}>
                Add a TikTok link
              </Link>
            )}
          </article>
          <p className={styles.body}>
            Restaurant selected: {place.name}
            <br />
            {place.area},{" "}
            {place.city === "jakarta" ? "Jakarta Selatan" : "Tangerang Selatan"}
          </p>
          {validUrl ? (
            <button
              className={`${styles.action} ${styles.yellow}`}
              onClick={() => {
                if (!previewSignedIn) {
                  router.push("/login?from=import");
                  return;
                }
                saveRecommendation();
                router.push("/import/success");
              }}
            >
              <DetailIcon name="bookmark" />
              <span>Save to Wishlist</span>
            </button>
          ) : (
            <>
              <p role="status" className={styles.caption}>
                Add your link before saving. No video was imported.
              </p>
              <Link
                className={`${styles.action} ${styles.yellow}`}
                href="/import"
              >
                Add a TikTok link
              </Link>
            </>
          )}
          <button
            className={styles.action}
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setChoosing(true);
            }}
          >
            Change restaurant
          </button>
          <Link className={styles.caption} href="/import">
            Edit TikTok link
          </Link>
        </>
      )}
      {choosing ? (
        <PreviewDialog
          title="Choose a restaurant"
          trigger={trigger}
          onClose={() => setChoosing(false)}
        >
          <div className={styles.choices}>
            {demoRestaurants.map((item) => (
              <button
                className={styles.choice}
                key={item.id}
                aria-pressed={place.id === item.id}
                onClick={(event) => {
                  setImportDraft({ ...importDraft, placeId: item.id });
                  event.currentTarget
                    .closest<HTMLDialogElement>("dialog")
                    ?.close();
                }}
              >
                {item.name} · {item.area}
              </button>
            ))}
          </div>
        </PreviewDialog>
      ) : null}
    </JourneyLayout>
  );
}
