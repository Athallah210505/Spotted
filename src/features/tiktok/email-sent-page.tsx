"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";
import { JourneyLayout } from "./journey-layout";
import { parseTikTokUrl } from "./tiktok-url";
import { findDemoRestaurant } from "@/features/restaurants/demo-data";
import styles from "./journey.module.css";

export function EmailSentPage({ fromImport }: { fromImport: boolean }) {
  const router = useRouter();
  const { emailLinkReady, signInPreview, importDraft, saveRecommendation } =
    usePreviewWishlist();
  const [resends, setResends] = useState(0);
  const loginHref = `/login${fromImport ? "?from=import" : ""}`;
  if (!emailLinkReady)
    return (
      <JourneyLayout title="Sign-in link preview" backHref={loginHref}>
        <h1>Request a preview sign-in link.</h1>
        <p className={`${styles.body} ${styles.muted}`}>
          This preview request is no longer available. Enter your email again to
          continue the simulation.
        </p>
        <Link href={loginHref} className={`${styles.action} ${styles.yellow}`}>
          Enter email address
        </Link>
      </JourneyLayout>
    );
  return (
    <JourneyLayout title="Sign-in link preview" backHref={loginHref}>
      <Image
        src="/figma/journey/email-check.svg"
        width={48}
        height={48}
        alt=""
      />
      <h1>Check your inbox.</h1>
      <p className={`${styles.body} ${styles.muted}`}>
        In production, open the sign-in link on this device to continue saving.
        This preview does not send email or create a verified session.
      </p>
      <button
        className={`${styles.action} ${styles.yellow}`}
        onClick={() => {
          signInPreview();
          if (
            fromImport &&
            parseTikTokUrl(importDraft.url) &&
            findDemoRestaurant(importDraft.placeId)
          ) {
            saveRecommendation();
            router.replace("/import/success");
          } else
            router.replace(fromImport ? "/import?step=confirm" : "/profile");
        }}
      >
        Simulate verified sign-in
      </button>
      <button
        className={styles.action}
        onClick={() => setResends((count) => count + 1)}
      >
        Resend sign-in link
      </button>
      <p role="status" className={styles.caption}>
        {resends
          ? `Preview link refreshed (${resends}). No email was sent.`
          : "Preview link ready. No email was sent."}
      </p>
      <Link href={loginHref} className={styles.caption}>
        Change email address
      </Link>
      <Link
        href={fromImport ? "/import?step=confirm" : "/explore"}
        className={styles.caption}
      >
        Keep browsing
      </Link>
    </JourneyLayout>
  );
}
