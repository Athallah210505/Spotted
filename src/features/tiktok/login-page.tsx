"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RestaurantPhoto } from "@/features/restaurants/restaurant-photo";
import { usePreviewWishlist } from "@/features/wishlist/preview-wishlist";
import { JourneyLayout } from "./journey-layout";
import { parseTikTokUrl } from "./tiktok-url";
import styles from "./journey.module.css";

export function LoginPage({ fromImport }: { fromImport: boolean }) {
  const router = useRouter();
  const { importDraft, signInPreview, saveRecommendation } =
    usePreviewWishlist();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const back = fromImport ? "/import?step=confirm" : "/profile";
  return (
    <JourneyLayout title="Save this craving" backHref={back}>
      <RestaurantPhoto
        src="/figma/journey/login-food.png"
        alt="Illustrative ramen bowl with egg and chopsticks"
        sizes="(max-width: 430px) 90vw, 390px"
        className={styles.hero}
        preload
      />
      <h1>
        Good places
        <br />
        are worth keeping.
      </h1>
      <p className={`${styles.body} ${styles.muted}`}>
        Sign in to save restaurants and find them nearby. You can keep browsing
        without an account.
      </p>
      {ready ? (
        <>
          <p role="status" className={styles.body}>
            Preview link ready. No email was sent.
          </p>
          <button
            className={`${styles.action} ${styles.yellow}`}
            onClick={() => {
              signInPreview();
              if (fromImport && parseTikTokUrl(importDraft.url)) {
                saveRecommendation();
                router.replace("/import/success");
              } else router.replace(fromImport ? "/import" : "/profile");
            }}
          >
            Continue preview sign-in
          </button>
          <button className={styles.action} onClick={() => setReady(false)}>
            Change email address
          </button>
        </>
      ) : (
        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const input = form.elements.namedItem("email") as HTMLInputElement;
            input.value = input.value.trim();
            if (!input.validity.valid) {
              setError("Enter a valid email address.");
              input.focus();
              return;
            }
            form.reset();
            setError("");
            setReady(true);
          }}
        >
          <label htmlFor="email-address" className={styles.label}>
            Email address
          </label>
          <input
            type="email"
            name="email"
            id="email-address"
            required
            maxLength={254}
            autoComplete="email"
            className={styles.input}
            placeholder="you@example.com"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "email-error" : "simulation-note"}
          />
          {error ? (
            <p role="alert" id="email-error" className={styles.error}>
              {error}
            </p>
          ) : null}
          <button className={`${styles.action} ${styles.yellow}`} type="submit">
            Email me a sign-in link
          </button>
        </form>
      )}
      <Link
        className={styles.action}
        href={fromImport ? "/import?step=confirm" : "/explore"}
      >
        Keep browsing
      </Link>
      <p id="simulation-note" className={styles.caption}>
        Simulated sign-in only. No email is sent or stored, and no real account
        is created. Your attempted import resumes after preview sign-in.
      </p>
    </JourneyLayout>
  );
}
