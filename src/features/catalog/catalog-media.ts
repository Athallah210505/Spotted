import type { catalog } from "./catalog";

type Place = (typeof catalog.places)[number];

// shortcut: a manually checked source snapshot; replace with licensed provider updates when available.
export const catalogRatings: Record<
  string,
  {
    value: number;
    reviewCount: number;
    provider: string;
    sourceUrl: string;
    checkedAt: string;
  }
> = {
  "node/4245907143": {
    value: 4.8,
    reviewCount: 38,
    provider: "Chope",
    sourceUrl:
      "https://www.chope.co/jakarta-restaurants/restaurant/cafe-batavia-jakarta-kota-tua-taman-sari?lang=en_US",
    checkedAt: "2026-10-25",
  },
};

export function catalogDetailHref(place: Pick<Place, "id">) {
  return `/restaurant/osm-${place.id.slice("node/".length)}`;
}

export const catalogPhotos: Record<
  string,
  {
    src: string;
    alt: string;
    author: string;
    sourceUrl: string;
    license: string;
    licenseUrl: string;
    note: string;
  }
> = {
  "node/4245907143": {
    src: "/catalog/cafe-batavia.jpg",
    alt: "Bangunan Cafe Batavia di Kota Tua Jakarta",
    author: "Hkurniawan",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Cafe_Batavia,_Jakarta.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    note: "Foto arsip bangunan; tampilan dipotong agar sesuai kartu.",
  },
  "node/12157326132": {
    src: "/catalog/gultik-blok-m.jpg",
    alt: "Sajian Gultik Blok M, foto kuliner kawasan",
    author: "Ayu Saraswati31",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Gultik_Blok_M.jpg",
    license: "CC0 1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    note: "Foto kuliner kawasan Blok M, bukan penjual tertentu; tampilan dipotong.",
  },
};

export function googleMapsUrl(place: Pick<Place, "latitude" | "longitude">) {
  const query = new URLSearchParams({
    api: "1",
    query: `${place.latitude},${place.longitude}`,
  });
  return `https://www.google.com/maps/search/?${query}`;
}
