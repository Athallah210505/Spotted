import styles from "@/features/restaurants/restaurant-detail.module.css";

export default function Loading() {
  return (
    <main
      className={styles.shell}
      aria-busy="true"
      aria-label="Loading restaurant details"
    >
      <p className={styles.loading} role="status">
        Loading restaurant details…
      </p>
    </main>
  );
}
