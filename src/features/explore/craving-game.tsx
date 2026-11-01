"use client";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PreviewDialog } from "@/components/ui/preview-dialog";
import { FoodPlaceCard } from "@/features/catalog/food-place-card";
import type { FoodResults } from "@/features/catalog/food-types";
import { cravingMatch, cravingQuestions } from "./craving-matcher";
import styles from "./craving-game.module.css";

export function CravingGame() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  return (
    <>
      <button
        className={styles.start}
        onClick={(event) => {
          trigger.current = event.currentTarget;
          setOpen(true);
        }}
      >
        <span>Bingung makan apa?</span>
        <span>
          5 pertanyaan <b aria-hidden="true">↗</b>
        </span>
      </button>
      {open ? (
        <PreviewDialog
          title="Cari selera kamu."
          trigger={trigger}
          onClose={() => setOpen(false)}
        >
          <Quiz />
        </PreviewDialog>
      ) : null}
    </>
  );
}

function Quiz() {
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [drag, setDrag] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const done = answers.length === cravingQuestions.length;
  const result = useQuery({
    queryKey: ["craving-results", answers],
    enabled: done,
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/places?limit=5&quiz=${answers.map((v) => (v ? "1" : "0")).join("")}`,
        { signal },
      );
      if (!response.ok) throw new Error("Rekomendasi belum bisa dimuat.");
      return (await response.json()) as FoodResults;
    },
    staleTime: 60_000,
  });
  function answer(yes: boolean) {
    setDrag(0);
    start.current = null;
    setAnswers((current) => (current.length < 5 ? [...current, yes] : current));
  }
  return (
    <div className={styles.quiz}>
      {!done ? (
        <>
          <div className={styles.progress}>
            <span>Pertanyaan {answers.length + 1} dari 5</span>
            <progress
              max={5}
              value={answers.length}
              aria-label="Progress pertanyaan"
            />
          </div>
          <p id="swipe-help">
            Geser kiri untuk tidak, kanan untuk ya. Bisa juga pakai tombol di
            bawah.
          </p>
          <div
            key={answers.length}
            className={styles.question}
            tabIndex={0}
            role="group"
            aria-label="Kartu pertanyaan"
            aria-describedby="swipe-help"
            style={{
              transform: `translateX(${drag}px) rotate(${drag / 16}deg)`,
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                answer(event.key === "ArrowRight");
              }
            }}
            onPointerDown={(event) => {
              if (!event.isPrimary || event.button !== 0) return;
              start.current = { x: event.clientX, y: event.clientY };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (
                start.current &&
                Math.abs(event.clientX - start.current.x) >
                  Math.abs(event.clientY - start.current.y)
              )
                setDrag(
                  Math.max(
                    -130,
                    Math.min(130, event.clientX - start.current.x),
                  ),
                );
            }}
            onPointerCancel={() => {
              start.current = null;
              setDrag(0);
            }}
            onPointerUp={(event) => {
              if (!start.current) return;
              const dx = event.clientX - start.current.x,
                dy = event.clientY - start.current.y;
              start.current = null;
              if (Math.abs(dx) >= 65 && Math.abs(dx) > Math.abs(dy) * 1.2)
                answer(dx > 0);
              else setDrag(0);
            }}
          >
            <span>{String(answers.length + 1).padStart(2, "0")}</span>
            <h3>{cravingQuestions[answers.length]!.question}</h3>
            <p aria-hidden="true">
              {drag < -35
                ? "Tidak"
                : drag > 35
                  ? "Ya"
                  : "Apa yang lagi kamu ingin?"}
            </p>
          </div>
          <div className={styles.answers}>
            <button onClick={() => answer(false)}>Tidak</button>
            <button onClick={() => answer(true)}>Ya</button>
          </div>
          {answers.length ? (
            <button
              className={styles.restart}
              onClick={() => {
                setAnswers((current) => current.slice(0, -1));
                setDrag(0);
              }}
            >
              Kembali satu pertanyaan
            </button>
          ) : null}
        </>
      ) : (
        <>
          <h3 className={styles.resultTitle}>Ini pilihan buat kamu.</h3>
          <p>
            Diurutkan dari kecocokan jawaban dengan jenis makanan yang tercatat.
            Data yang belum diketahui tidak dianggap cocok.
          </p>
          {result.isPending ? (
            <p role="status">Mencari pilihan yang cocok…</p>
          ) : result.isError ? (
            <div role="alert">
              <p>Rekomendasi belum bisa dimuat.</p>
              <button
                className={styles.restart}
                onClick={() => result.refetch()}
              >
                Coba lagi
              </button>
            </div>
          ) : !result.data?.places.length ? (
            <p role="status">Belum ada pilihan yang bisa dicocokkan.</p>
          ) : (
            <div className={styles.results}>
              {result.data.places.map((place) => (
                <div key={place.id}>
                  <p className={styles.match}>
                    {cravingMatch(place, answers).reasons.length} dari 5
                    preferensi cocok
                  </p>
                  <FoodPlaceCard place={place} />
                  <ul>
                    {cravingMatch(place, answers).reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <button className={styles.start} onClick={() => setAnswers([])}>
            Main lagi
          </button>
        </>
      )}
    </div>
  );
}
