import styles from "./browse.module.css";

export function BrowseLoading() {
  return (
    <main className={styles.shell} aria-busy="true">
      <p className={styles.content} role="status">
        Loading saved places and map…
      </p>
    </main>
  );
}
