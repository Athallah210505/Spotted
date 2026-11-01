import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { existsSync } from "node:fs";
import {
  googlePlaces,
  areaNames,
  distanceFromBlokM,
  isOpenAt,
  matchesCategory,
} from "./google-data";
import { googleMapsUrl } from "./catalog-media";
import { cravingMatch } from "@/features/explore/craving-matcher";
import type { ExploreFilters } from "@/features/explore/demo-data";
import type { FoodPlace, MapSpot } from "./food-types";

const categoryLabels: Record<string, string> = {
  restaurant: "Restoran",
  cafe: "Kedai kopi",
  fast_food: "Makanan cepat saji",
  food_court: "Pujasera",
  food_business: "Tempat makan",
  bakery: "Toko roti",
  pastry: "Pastry",
  ice_cream: "Es krim",
  coffee_shop: "Kedai kopi",
  coffee: "Kopi",
  tea: "Teh",
  chocolate: "Cokelat",
  confectionery: "Toko manisan",
  deli: "Deli",
  food_and_beverage_store: "Makanan dan minuman",
};
function localPhoto(value: unknown): string | null {
  return typeof value === "string" &&
    /^\/google-places\/[a-z0-9-]+\.(jpg|png|webp)$/.test(value) &&
    existsSync(path.join(process.cwd(), "public", value))
    ? value
    : null;
}
const publishedOrder = new Map(
  googlePlaces.map((place, index) => [place.id, index]),
);
let cached: { places: FoodPlace[]; databaseTotal: number } | undefined;
export function foodCatalog() {
  if (cached) return cached;
  const db = new DatabaseSync(
    path.join(
      process.cwd(),
      "research/jaksel-jakbar-2026-10-28/food-database.sqlite",
    ),
    { readOnly: true },
  );
  try {
    const rows = db
      .prepare(
        `SELECT a.*, p.cuisine, p.google_hours_json, p.google_maps_url,
      d.category AS source_category, d.address_locality_conflict,
      json_extract(gs.payload_json,'$.category') AS google_category,
      json_extract(gs.payload_json,'$.photoPath') AS local_photo_path,
      json_extract(gs.payload_json,'$.description') AS description,
      json_extract(gs.payload_json,'$.menuPhotos') AS menu_photos_json
      FROM all_food_places a
      LEFT JOIN places p ON p.id=a.id
      LEFT JOIN discovery_places d ON d.id=substr(a.id,10)
      LEFT JOIN place_sources gs ON gs.place_id=a.id AND gs.provider='google' `,
      )
      .all();
    const places = new Map<string, FoodPlace>();
    for (const row of rows) {
      if (!row.name || row.operating_status === "google_listing_closed")
        continue;
      const coords = {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      };
      places.set(String(row.id), {
        id: String(row.id),
        name: String(row.name),
        city: String(row.city),
        district: String(row.district),
        category:
          categoryLabels[
            String(row.google_category ?? row.category).toLowerCase()
          ] ?? String(row.google_category ?? row.category).replaceAll("_", " "),
        cuisine:
          row.cuisine && !Object.hasOwn(categoryLabels, String(row.cuisine))
            ? String(row.cuisine).replaceAll("_", " ").replaceAll(";", ", ")
            : "",
        ...coords,
        address:
          row.address_locality_conflict === 1
            ? null
            : row.address
              ? String(row.address)
              : null,
        rating: row.google_rating === null ? null : Number(row.google_rating),
        reviewCount:
          row.google_review_count === null
            ? null
            : Number(row.google_review_count),
        photoPath: localPhoto(row.local_photo_path),
        description:
          typeof row.description === "string" ? row.description : null,
        menuPhotos: (
          JSON.parse(
            String(row.menu_photos_json ?? "[]"),
          ) as FoodPlace["menuPhotos"]
        ).filter((photo) => localPhoto(photo.photoPath)),
        hours: row.google_hours_json
          ? JSON.parse(String(row.google_hours_json))
          : [],
        mapsUrl: row.google_maps_url
          ? String(row.google_maps_url)
          : googleMapsUrl({
              ...coords,
              name: String(row.name),
              address:
                row.address_locality_conflict === 1
                  ? null
                  : row.address
                    ? String(row.address)
                    : null,
              district: String(row.district),
              city: String(row.city),
            }),
      });
    }
    for (const row of googlePlaces)
      places.set(row.id, {
        id: row.id,
        name: row.name,
        city: "Jakarta",
        district: areaNames[row.area] ?? row.area,
        category: row.category,
        cuisine: row.category,
        latitude: row.latitude,
        longitude: row.longitude,
        address: row.address,
        rating: row.rating,
        reviewCount: row.reviewCount,
        photoPath: row.photoPath,
        description: row.description ?? null,
        menuPhotos: row.menuPhotos,
        hours: row.hours,
        mapsUrl: row.mapsUrl,
      });
    cached = { places: [...places.values()], databaseTotal: rows.length };
    return cached;
  } finally {
    db.close();
  }
}
export function findFoodPlace(slug: string) {
  return foodCatalog().places.find((place) => foodSlug(place.id) === slug);
}
export function foodSlug(id: string) {
  return id.startsWith("node/") ? `osm-${id.slice(5)}` : id.replace("/", "-");
}
export function searchFoodPlaces(
  filters: ExploreFilters,
  savedIds: string[] = [],
  quiz?: boolean[],
) {
  const q = filters.query.toLocaleLowerCase("id");
  const places = foodCatalog().places.filter(
    (p) =>
      filters.city === "jakarta" &&
      `${p.name} ${p.district} ${p.category} ${p.cuisine} ${p.address ?? ""}`
        .toLocaleLowerCase("id")
        .includes(q) &&
      matchesCategory(
        { name: `${p.name} ${p.cuisine}`, category: p.category },
        filters.category,
      ) &&
      (!filters.minRating ||
        (p.rating !== null && p.rating >= filters.minRating)) &&
      (!filters.savedOnly || savedIds.includes(p.id)) &&
      (!filters.distance || distanceFromBlokM(p) <= filters.distance * 1000) &&
      (!filters.openNow || isOpenAt(p, new Date()) === true) &&
      !filters.price &&
      !filters.halalOnly,
  );
  const scores = quiz
    ? new Map(places.map((p) => [p.id, cravingMatch(p, quiz).score]))
    : null;
  return places.sort(
    (a, b) =>
      (scores ? scores.get(b.id)! - scores.get(a.id)! : 0) ||
      (filters.sort === "nearest"
        ? distanceFromBlokM(a) - distanceFromBlokM(b)
        : filters.sort === "most_reviewed"
          ? (b.reviewCount ?? -1) - (a.reviewCount ?? -1)
          : filters.sort === "highest_rated"
            ? (b.rating ?? -1) - (a.rating ?? -1)
            : (publishedOrder.get(a.id) ?? 1e6) -
              (publishedOrder.get(b.id) ?? 1e6)) ||
      (b.rating ?? -1) - (a.rating ?? -1) ||
      a.name.localeCompare(b.name) ||
      a.id.localeCompare(b.id),
  );
}

export function clusterMapPlaces(places: FoodPlace[], zoom: number): MapSpot[] {
  const cells = new Map<
    string,
    { x: number; y: number; places: FoodPlace[] }[]
  >();
  const groups: { x: number; y: number; places: FoodPlace[] }[] = [];
  const scale = 256 * 2 ** zoom;
  for (const place of places) {
    const sin = Math.sin((place.latitude * Math.PI) / 180);
    const x = ((place.longitude + 180) / 360) * scale;
    const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
    const col = Math.floor(x / 88),
      row = Math.floor(y / 56);
    let found: (typeof groups)[number] | undefined;
    for (let dx = -1; dx <= 1 && !found; dx++)
      for (let dy = -1; dy <= 1 && !found; dy++)
        found = cells
          .get(`${col + dx},${row + dy}`)
          ?.find(
            (group) => Math.abs(group.x - x) < 88 && Math.abs(group.y - y) < 56,
          );
    if (found) found.places.push(place);
    else {
      const group = { x, y, places: [place] };
      groups.push(group);
      const key = `${col},${row}`;
      const cell = cells.get(key) ?? [];
      cell.push(group);
      cells.set(key, cell);
    }
  }
  return groups.map(({ places: group }) => ({
    latitude: group[0]!.latitude,
    longitude: group[0]!.longitude,
    count: group.length,
    ...(group.length === 1
      ? { place: group[0]! }
      : zoom === 19
        ? { members: group.map((p) => ({ id: p.id, name: p.name })) }
        : {}),
  }));
}
