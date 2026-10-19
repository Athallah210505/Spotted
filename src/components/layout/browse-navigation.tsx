import Link from "next/link";
import { BrowseIcon } from "./browse-icon";
import styles from "./browse.module.css";

export function BrowseNavigation({
  active,
  search = "",
  onExplore,
  onProfile,
}: {
  active: "Explore" | "Map" | "Wishlist";
  search?: string;
  onExplore?: () => void;
  onProfile: (button: HTMLButtonElement) => void;
}) {
  return (
    <footer className={styles.dock}>
      <p className={styles.demoLabel}>Illustrative data</p>
      <nav className={styles.navigation} aria-label="Main navigation">
        {(
          [
            ["Explore", "compass", "/explore"],
            ["Map", "map", "/map"],
            ["Wishlist", "bookmark", "/wishlist"],
          ] as const
        ).map(([label, icon, path]) => {
          const content = (
            <>
              <BrowseIcon name={icon} />
              <span>{label}</span>
            </>
          );
          return label === "Explore" && onExplore ? (
            <button
              key={label}
              className={styles.navItem}
              aria-current={active === label ? "page" : undefined}
              onClick={onExplore}
            >
              {content}
            </button>
          ) : (
            <Link
              key={label}
              className={styles.navItem}
              href={`${path}${search ? `?${search}` : ""}`}
              aria-current={active === label ? "page" : undefined}
            >
              {content}
            </Link>
          );
        })}
        <button
          className={styles.navItem}
          onClick={(event) => onProfile(event.currentTarget)}
          aria-haspopup="dialog"
        >
          <BrowseIcon name="user" />
          <span>Profile</span>
        </button>
      </nav>
    </footer>
  );
}
