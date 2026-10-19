import styles from "@/components/layout/browse.module.css";

export default function ExploreLoading() {
  return (
    <div className={styles.shell} role="status" aria-label="Loading Explore">
      <div className={styles.safeArea} />
      <div className={styles.content} aria-hidden="true">
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonLine} />
        <div className={styles.skeletonCard} />
      </div>
      <span className="sr-only">Loading restaurants…</span>
    </div>
  );
}
