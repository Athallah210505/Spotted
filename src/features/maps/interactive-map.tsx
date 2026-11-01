"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { BrowseNavigation } from "@/components/layout/browse-navigation";
import { distanceBetween, googlePlaces } from "@/features/catalog/google-data";
import { catalogDetailHref } from "@/features/catalog/catalog-media";
import browse from "@/components/layout/browse.module.css";
import styles from "./interactive-map.module.css";
import { radii, type Radius } from "./map-options";

export function InteractiveMap() {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const locationRef = useRef<Leaflet.LayerGroup | null>(null);
  const tilesRef = useRef<Leaflet.TileLayer | null>(null);
  const locationRequest = useRef(0);
  const watchId = useRef<number | null>(null);
  const followLocation = useRef(true);
  const frameRequested = useRef(true);
  const [tracking, setTracking] = useState(false);
  const [origin, setOrigin] = useState<{
    latitude: number;
    longitude: number;
    source: "gps" | "manual";
    accuracy?: number;
  } | null>(null);
  const [radius, setRadius] = useState<Radius>(1);
  const [selecting, setSelecting] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [status, setStatus] = useState(
    "Gunakan lokasi saya untuk melihat peta di sekitar Anda.",
  );
  const [tileError, setTileError] = useState(false);
  const nearbyCount = origin
    ? googlePlaces.filter(
        (place) => distanceBetween(origin, place) <= radius * 1000,
      ).length
    : 0;
  const stopTracking = useCallback(() => {
    locationRequest.current++;
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTracking(false);
    setLoadingLocation(false);
  }, []);
  const choosePoint = useCallback(
    (point: Leaflet.LatLng) => {
      stopTracking();
      frameRequested.current = true;
      setSelecting(false);
      setOrigin({
        latitude: point.lat,
        longitude: point.lng,
        source: "manual",
      });
      setStatus("Titik dipilih. Geser pin untuk menyesuaikan pusat radius.");
    },
    [stopTracking],
  );

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
        map.on("dragstart", () => {
          followLocation.current = false;
        });
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
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      resize?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      locationRef.current = null;
      tilesRef.current = null;
    };
  }, [router]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !selecting) return;
    const select = (event: Leaflet.LeafletMouseEvent) =>
      choosePoint(event.latlng);
    map.on("click", select);
    return () => {
      map.off("click", select);
    };
  }, [ready, selecting, choosePoint]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = locationRef.current;
    if (!ready || !origin || !L || !map || !layer) return;
    layer.clearLayers();
    const point: Leaflet.LatLngTuple = [origin.latitude, origin.longitude];
    const circle = L.circle(point, {
      radius: radius * 1000,
      color: "#4a69b3",
      weight: 2,
      fillOpacity: 0.09,
      interactive: false,
    }).addTo(layer);
    circle.getElement()?.setAttribute("role", "img");
    circle.getElement()?.setAttribute("aria-label", `Radius ${radius} km`);
    circle
      .getElement()
      ?.setAttribute("data-radius-meters", String(radius * 1000));
    if (origin.source === "gps" && origin.accuracy) {
      L.circle(point, {
        radius: origin.accuracy,
        color: "#61615c",
        weight: 1,
        dashArray: "3 4",
        fillOpacity: 0.04,
        interactive: false,
      }).addTo(layer);
    }
    const icon = document.createElement("span");
    icon.className = styles.userPin!;
    const label =
      origin.source === "gps" ? "Lokasi Anda" : "Titik pilihan Anda";
    const pin = L.marker(point, {
      icon: L.divIcon({
        html: icon,
        className: styles.personalMarker,
        iconSize: [40, 44],
        iconAnchor: [20, 40],
      }),
      draggable: true,
      zIndexOffset: 1000,
      title: label,
    }).addTo(layer);
    pin.getElement()?.setAttribute("aria-label", label);
    pin.on("dragend", () => choosePoint(pin.getLatLng()));
    pin.bindTooltip(label, {
      permanent: true,
      direction: "top",
      offset: [0, -36],
    });
    const frameRadius = () =>
      map.fitBounds(circle.getBounds(), {
        padding: [24, 24],
        maxZoom: 16,
        animate: false,
      });
    pin.on("click", frameRadius);
    pin.getElement()?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        frameRadius();
      }
    });
    if (origin.source === "manual" || frameRequested.current) {
      frameRadius();
      frameRequested.current = false;
    } else if (followLocation.current) {
      map.panTo(point, {
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        duration: 0.3,
      });
    }
    return () => {
      layer.clearLayers();
    };
  }, [ready, origin, radius, choosePoint]);

  function locate() {
    stopTracking();
    setSelecting(false);
    if (!window.isSecureContext) {
      setStatus(
        "Lokasi memerlukan HTTPS atau localhost. Gunakan Pilih titik untuk menentukan lokasi secara manual.",
      );
      return;
    }
    if (!navigator.geolocation) {
      setStatus(
        "Browser ini belum mendukung lokasi. Gunakan Pilih titik untuk menentukan lokasi secara manual.",
      );
      return;
    }
    const request = locationRequest.current;
    followLocation.current = true;
    frameRequested.current = true;
    setLoadingLocation(true);
    setTracking(true);
    setStatus("Menunggu izin dan mencari lokasi Anda…");
    let receivedFix = false;
    function watch(highAccuracy: boolean) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          if (!mapRef.current || request !== locationRequest.current) return;
          const { latitude, longitude, accuracy } = position.coords;
          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180
          )
            return;
          receivedFix = true;
          setOrigin({ latitude, longitude, source: "gps", accuracy });
          setLoadingLocation(false);
          setStatus(
            "Lokasi Anda ditemukan. Posisi diperbarui selama pelacakan aktif.",
          );
        },
        (error) => {
          if (!mapRef.current || request !== locationRequest.current) return;
          if (receivedFix && error.code !== 1) {
            setStatus(
              "Sinyal lokasi terputus. Menampilkan titik terakhir sambil menunggu pembaruan…",
            );
            return;
          }
          if (highAccuracy && error.code !== 1) {
            if (watchId.current !== null)
              navigator.geolocation.clearWatch(watchId.current);
            setStatus("GPS belum tersedia. Mencoba lokasi dari jaringan…");
            watch(false);
            return;
          }
          stopTracking();
          setStatus(
            error.code === 1
              ? "Izin lokasi ditolak. Izinkan lokasi di pengaturan browser dan perangkat, lalu coba lagi. Anda tetap bisa memilih titik."
              : error.code === 3
                ? "Pencarian lokasi terlalu lama. Coba lagi atau gunakan Pilih titik."
                : "Lokasi belum terbaca. Periksa layanan lokasi perangkat atau gunakan Pilih titik.",
          );
        },
        { enableHighAccuracy: highAccuracy, timeout: 12000, maximumAge: 0 },
      );
    }
    watch(true);
  }

  return (
    <div className={`${browse.shell} ${styles.shell}`}>
      <a className={browse.skipLink} href="#interactive-map">
        Skip to map
      </a>
      <header className={styles.header}>
        <h1>Find your next spot.</h1>
        <div className={styles.actions}>
          <button
            onClick={locate}
            disabled={!ready || loadingLocation}
            aria-pressed={tracking}
          >
            {loadingLocation ? "Mencari lokasi…" : "Gunakan lokasi saya"}
          </button>
          <button
            className={styles.selectButton}
            disabled={!ready}
            aria-pressed={selecting}
            onClick={() => {
              stopTracking();
              setSelecting(!selecting);
              setStatus(
                selecting
                  ? "Mode pilih titik dibatalkan. Peta tetap bisa digeser."
                  : "Ketuk peta untuk memasang pin, atau gunakan titik tengah peta.",
              );
            }}
          >
            {selecting ? "Batal pilih titik" : "Pilih titik"}
          </button>
        </div>
        <div
          className={styles.radii}
          role="group"
          aria-label="Radius dari titik Anda"
        >
          {radii.map((value) => (
            <button
              key={value}
              disabled={!ready}
              aria-pressed={radius === value}
              onClick={() => {
                frameRequested.current = true;
                setRadius(value);
              }}
            >
              {value} km
            </button>
          ))}
        </div>
        <p role="status">{status}</p>
        {origin?.source === "gps" && origin.accuracy !== undefined ? (
          <p>
            Akurasi lokasi ±
            {Math.round(origin.accuracy).toLocaleString("id-ID")} m
          </p>
        ) : null}
        {tracking ? (
          <button
            className={styles.stopButton}
            onClick={() => {
              stopTracking();
              setStatus(
                "Pelacakan dihentikan. Titik terakhir tetap terlihat di peta.",
              );
            }}
          >
            Hentikan pelacakan
          </button>
        ) : null}
        {selecting ? (
          <button
            className={styles.centerButton}
            onClick={() => {
              const center = mapRef.current?.getCenter();
              if (center) choosePoint(center);
            }}
          >
            Gunakan titik tengah peta
          </button>
        ) : null}
        {origin ? (
          <p className={styles.nearby} aria-live="polite">
            {nearbyCount} tempat dalam radius {radius} km
          </p>
        ) : null}
      </header>
      <main className={styles.main} id="interactive-map" tabIndex={-1}>
        <div
          ref={container}
          className={styles.map}
          data-selecting={selecting}
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
