"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { BrowseNavigation } from "@/components/layout/browse-navigation";
import { googlePlaces } from "@/features/catalog/google-data";
import { catalogDetailHref } from "@/features/catalog/catalog-media";
import browse from "@/components/layout/browse.module.css";
import styles from "./interactive-map.module.css";

export function InteractiveMap() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const locationRef = useRef<Leaflet.LayerGroup | null>(null);
  const tilesRef = useRef<Leaflet.TileLayer | null>(null);
  const [ready, setReady] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [status, setStatus] = useState(
    "Gunakan lokasi saya untuk melihat peta di sekitar Anda.",
  );
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    let disposed = false;
    let resize: ResizeObserver | undefined;
    void import("leaflet")
      .then((L) => {
        if (disposed || !container.current) return;
        leafletRef.current = L;
        const map = L.map(container.current, { zoomControl: false }).setView(
          [-6.244, 106.8],
          14,
        );
        mapRef.current = map;
        L.control
          .zoom({
            position: "bottomright",
            zoomInTitle: "Perbesar peta",
            zoomOutTitle: "Perkecil peta",
          })
          .addTo(map);
        const tiles = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        ).addTo(map);
        tilesRef.current = tiles;
        tiles.on("tileerror", () => {
          if (!disposed) setTileError(true);
        });
        for (const place of googlePlaces) {
          const label = document.createElement("span");
          label.textContent = `★ ${place.rating.toFixed(1)}`;
          const content = document.createElement("div");
          content.className = styles.popup!;
          const name = document.createElement("strong");
          name.textContent = place.name;
          const rating = document.createElement("p");
          rating.textContent = `${place.rating.toFixed(1)} · Google (${place.reviewCount.toLocaleString("id-ID")})`;
          const link = document.createElement("a");
          link.href = `${catalogDetailHref(place)}?from=map`;
          link.textContent = "Lihat detail";
          link.addEventListener("click", (event) => {
            if (
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              event.preventDefault();
              router.push(link.getAttribute("href")!);
            }
          });
          content.append(name, rating, link);
          const marker = L.marker([place.latitude, place.longitude], {
            icon: L.divIcon({
              html: label,
              className: styles.marker,
              iconSize: [62, 36],
              iconAnchor: [31, 18],
            }),
            title: place.name,
            alt: `${place.name}, rating ${place.rating.toFixed(1)}`,
            riseOnHover: true,
          })
            .bindPopup(content, { maxWidth: 260 })
            .addTo(map);
          marker
            .getElement()
            ?.setAttribute(
              "aria-label",
              `${place.name}, rating ${place.rating.toFixed(1)}`,
            );
        }
        locationRef.current = L.layerGroup().addTo(map);
        const updatePosition = () => {
          if (!container.current) return;
          container.current.dataset.zoom = String(map.getZoom());
          container.current.dataset.center = `${map.getCenter().lat.toFixed(5)},${map.getCenter().lng.toFixed(5)}`;
        };
        map.on("moveend zoomend", updatePosition);
        updatePosition();
        resize = new ResizeObserver(() => map.invalidateSize());
        resize.observe(container.current);
        setReady(true);
      })
      .catch(() => {
        if (!disposed)
          setStatus(
            "Peta gagal dimuat. Muat ulang halaman untuk mencoba lagi.",
          );
      });
    return () => {
      disposed = true;
      resize?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      locationRef.current = null;
      tilesRef.current = null;
    };
  }, [router]);

  function locate() {
    if (!navigator.geolocation) {
      setStatus(
        "Browser ini belum mendukung lokasi. Anda tetap bisa menggeser peta.",
      );
      return;
    }
    setLoadingLocation(true);
    setStatus("Menunggu izin dan mencari lokasi Anda…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const L = leafletRef.current;
        const map = mapRef.current;
        if (!map || !L || !locationRef.current) return;
        const point: Leaflet.LatLngTuple = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        locationRef.current.clearLayers();
        L.circle(point, {
          radius: position.coords.accuracy,
          color: "#4b68b3",
          weight: 1,
          fillOpacity: 0.08,
        }).addTo(locationRef.current);
        L.circleMarker(point, {
          radius: 8,
          color: "white",
          weight: 3,
          fillColor: "#4b68b3",
          fillOpacity: 1,
        })
          .bindTooltip("Lokasi Anda")
          .addTo(locationRef.current);
        map.setView(point, 15, { animate: false });
        setLoadingLocation(false);
        setStatus(
          "Peta mengikuti lokasi Anda. Geser atau zoom untuk menjelajah.",
        );
      },
      (error) => {
        if (!mapRef.current) return;
        setLoadingLocation(false);
        setStatus(
          error.code === 1
            ? "Izin lokasi ditolak. Aktifkan lewat pengaturan browser untuk mencoba lagi; peta tetap bisa digeser."
            : error.code === 3
              ? "Pencarian lokasi terlalu lama. Coba lagi atau geser peta secara manual."
              : "Lokasi belum terbaca. Coba lagi atau geser peta secara manual.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  return (
    <div className={`${browse.shell} ${styles.shell}`}>
      <a className={browse.skipLink} href="#interactive-map">
        Skip to map
      </a>
      <header className={styles.header}>
        <h1>Find your next spot.</h1>
        <button onClick={locate} disabled={!ready || loadingLocation}>
          {loadingLocation ? "Mencari lokasi…" : "Gunakan lokasi saya"}
        </button>
        <p role="status">{status}</p>
      </header>
      <main className={styles.main} id="interactive-map" tabIndex={-1}>
        <div
          ref={container}
          className={styles.map}
          role="region"
          aria-label="Peta tempat makan"
        />
        {!ready ? <p className={styles.notice}>Memuat peta…</p> : null}
        {tileError ? (
          <div className={styles.notice} role="alert">
            Peta jalan belum termuat. Periksa koneksi Anda.
            <button
              onClick={() => {
                setTileError(false);
                tilesRef.current?.redraw();
              }}
            >
              Coba lagi
            </button>
          </div>
        ) : null}
      </main>
      <BrowseNavigation active="Map" label="" />
    </div>
  );
}
