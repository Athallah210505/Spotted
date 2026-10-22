import Link from "next/link";
import { DetailIcon } from "@/features/restaurants/detail-icon";
import { BrowseNavigation } from "@/components/layout/browse-navigation";
import shared from "@/components/layout/browse.module.css";
import styles from "./journey.module.css";

export function JourneyLayout({
  title,
  backHref = "/wishlist",
  children,
  masthead,
  navigation = false,
}: {
  title?: string;
  backHref?: string;
  children: React.ReactNode;
  masthead?: React.ReactNode;
  navigation?: boolean;
}) {
  return (
    <div className={`${shared.shell} ${masthead ? shared.yellowSafe : ""}`}>
      <a href="#journey-content" className={shared.skipLink}>
        Skip to content
      </a>
      <div className={shared.safeArea}>
        <Link
          className={shared.quickLocation}
          href="/explore"
          aria-label="Choose area in Explore"
        >
          <DetailIcon name="locate" />
        </Link>
      </div>
      <main id="journey-content" className={shared.scrollArea} tabIndex={-1}>
        <div className={styles.content}>
          {masthead ? (
            <header className={styles.masthead}>{masthead}</header>
          ) : null}
          {title ? (
            <header className={styles.header}>
              <Link href={backHref} className={styles.back} aria-label="Back">
                <DetailIcon name="back" />
              </Link>
              <p>{title}</p>
            </header>
          ) : null}
          {children}
        </div>
      </main>
      {navigation ? (
        <BrowseNavigation active="Wishlist" />
      ) : (
        <footer className={styles.footer}>Illustrative data</footer>
      )}
    </div>
  );
}
