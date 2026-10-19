"use client";

import { useCallback, useRef } from "react";
import styles from "@/components/layout/browse.module.css";

export function PreviewDialog({
  title,
  children,
  trigger,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  trigger: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const attachDialog = useCallback((element: HTMLDialogElement | null) => {
    dialog.current = element;
    if (element && !element.open) {
      element.showModal();
      element.querySelector<HTMLButtonElement>("button")?.focus();
    }
  }, []);
  return (
    <dialog
      className={styles.dialog}
      aria-labelledby="preview-dialog-title"
      ref={attachDialog}
      onClose={() => {
        onClose();
        trigger.current?.focus({ preventScroll: true });
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href], input:not(:disabled)",
          ),
        ].filter((element) => element.getClientRects().length);
        event.preventDefault();
        const index = controls.indexOf(document.activeElement as HTMLElement);
        controls[
          (index + (event.shiftKey ? -1 : 1) + controls.length) %
            controls.length
        ]?.focus();
      }}
    >
      <button
        className={styles.closeDialog}
        aria-label="Close dialog"
        onClick={() => dialog.current?.close()}
      >
        ×
      </button>
      <h2 id="preview-dialog-title">{title}</h2>
      {children}
    </dialog>
  );
}
