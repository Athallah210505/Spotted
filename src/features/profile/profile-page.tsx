"use client";

import { useRef, useState } from "react";
import { BrowseIcon } from "@/components/layout/browse-icon";
import { BrowseNavigation } from "@/components/layout/browse-navigation";
import { PreviewDialog } from "@/components/ui/preview-dialog";
import shared from "@/components/layout/browse.module.css";
import { AccountIcon } from "./account-icon";
import { usePreviewProfile } from "./preview-profile";
import styles from "./profile.module.css";

type Panel =
  "name" | "city" | "privacy" | "account" | "signout" | "delete" | null;
const titles = {
  name: "Display name",
  city: "Preferred city",
  privacy: "Your privacy",
  account: "Account settings",
  signout: "Sign out unavailable",
  delete: "No account to delete",
};

export function ProfilePage() {
  const { profile, updateProfile } = usePreviewProfile();
  const [panel, setPanel] = useState<Panel>(null);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLElement | null>(null);
  function open(value: Panel, element: HTMLElement) {
    trigger.current = element;
    setError("");
    setPanel(value);
  }
  function close() {
    setPanel(null);
    trigger.current?.focus({ preventScroll: true });
  }
  const search = new URLSearchParams();
  if (profile.city !== "jakarta") search.set("city", profile.city);
  if (profile.radius !== 5) search.set("radius", String(profile.radius));
  return (
    <div className={shared.shell}>
      <a className={shared.skipLink} href="#profile-content">
        Skip to profile
      </a>
      <div className={shared.safeArea}>
        <button
          className={shared.quickLocation}
          aria-label="Choose preferred city"
          onClick={(event) => open("city", event.currentTarget)}
        >
          <BrowseIcon name="locate" size={16} />
        </button>
      </div>
      <main id="profile-content" tabIndex={-1} className={shared.scrollArea}>
        <div className={styles.content}>
          <h1>
            A little
            <br />
            about you.
          </h1>
          <div className={styles.identity}>
            <div
              className={styles.avatar}
              aria-label="Illustrative account initials AN"
            >
              AN
            </div>
            <div>
              <h2>{profile.name}</h2>
              <p className={styles.caption}>
                Illustrative account · this visit only
              </p>
            </div>
          </div>
          <p className={styles.label}>Display name</p>
          <button
            className={styles.action}
            onClick={(event) => open("name", event.currentTarget)}
            aria-label="Edit display name"
          >
            <AccountIcon name="profile-chevron" />
            <span>{profile.name}</span>
          </button>
          <p className={styles.label}>Preferred city</p>
          <button
            className={styles.action}
            onClick={(event) => open("city", event.currentTarget)}
            aria-label="Edit preferred city"
          >
            <AccountIcon name="profile-pin" />
            <span>
              {profile.city === "jakarta" ? "Jakarta" : "Tangerang Selatan"}
            </span>
          </button>
          <p className={styles.label}>Default nearby radius</p>
          <div
            className={styles.radius}
            role="group"
            aria-label="Default nearby radius"
          >
            {([1, 3, 5, 10] as const).map((radius) => (
              <button
                key={radius}
                aria-pressed={profile.radius === radius}
                onClick={() => updateProfile({ radius })}
              >
                {radius} km
              </button>
            ))}
          </div>
          <h2 className={styles.sectionHeading}>Your privacy</h2>
          <button
            className={styles.action}
            onClick={(event) => open("privacy", event.currentTarget)}
          >
            <AccountIcon name="profile-shield" />
            <span>Privacy settings</span>
          </button>
          <p className={styles.supporting}>
            Your sample wishlist and preferences stay in this open app. No
            device location is requested.
          </p>
          <button
            className={styles.action}
            onClick={(event) => open("account", event.currentTarget)}
          >
            <AccountIcon name="profile-user" />
            <span>Account settings</span>
          </button>
          <button
            className={styles.action}
            onClick={(event) => open("signout", event.currentTarget)}
          >
            Sign out
          </button>
          <button
            className={`${styles.action} ${styles.pink}`}
            onClick={(event) => open("delete", event.currentTarget)}
          >
            Delete account
          </button>
        </div>
      </main>
      <BrowseNavigation active="Profile" search={search.toString()} />
      {panel ? (
        <PreviewDialog title={titles[panel]} trigger={trigger} onClose={close}>
          {panel === "name" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const name = String(
                  new FormData(event.currentTarget).get("name") ?? "",
                ).trim();
                if (!name || name.length > 50) {
                  setError("Enter a display name between 1 and 50 characters.");
                  return;
                }
                updateProfile({ name });
                event.currentTarget
                  .closest<HTMLDialogElement>("dialog")
                  ?.close();
              }}
            >
              <label className={styles.label} htmlFor="display-name">
                Display name
              </label>
              <input
                id="display-name"
                name="name"
                className={styles.input}
                defaultValue={profile.name}
                maxLength={50}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "name-error" : undefined}
              />
              {error ? (
                <p id="name-error" role="alert">
                  {error}
                </p>
              ) : null}
              <p>Changes last for this visit only.</p>
              <button
                className={`${styles.action} ${styles.yellow}`}
                type="submit"
              >
                Save name
              </button>
            </form>
          ) : panel === "city" ? (
            <>
              <p>
                Choose the sample area used when no city is specified in the
                URL.
              </p>
              {(["jakarta", "tangsel"] as const).map((city) => (
                <button
                  key={city}
                  className={shared.locationOption}
                  aria-pressed={profile.city === city}
                  onClick={(event) => {
                    updateProfile({ city });
                    event.currentTarget
                      .closest<HTMLDialogElement>("dialog")
                      ?.close();
                  }}
                >
                  {city === "jakarta"
                    ? "Jakarta · Blok M"
                    : "Tangerang Selatan · Bintaro"}
                </button>
              ))}
            </>
          ) : panel === "privacy" ? (
            <p>
              This preview stores sample saves and preferences in memory until
              you reload. It does not request device location or import private
              video links. Account privacy controls are not connected.
            </p>
          ) : (
            <p>
              {panel === "delete"
                ? "This is an illustrative profile. No real account exists here, so nothing can be deleted."
                : panel === "signout"
                  ? "No live sign-in session is connected to this preview."
                  : "Account settings are not connected. You can edit the display name, preferred city and radius for this visit."}
            </p>
          )}
        </PreviewDialog>
      ) : null}
    </div>
  );
}
