import Link from "next/link";
import Image from "next/image";
import styles from "./browse.module.css";

export function BrowseNavigation({
  active,
  search = "",
  onExplore,
}: {
  active: "Explore" | "Map" | "Wishlist" | "Profile";
  search?: string;
  onExplore?: () => void;
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
            ["Profile", "user", "/profile"],
          ] as const
        ).map(([label, icon, path]) => {
          const content = (
            <>
              <Image
                src={`/figma/editorial/${icon}${active === label ? "" : "-white"}.svg`}
                width={22}
                height={22}
                alt=""
              />
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
      </nav>
    </footer>
  );
}
