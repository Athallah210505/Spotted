import { z } from "zod";
import snapshot from "./data/google-places.json";
import type { ExploreFilters } from "@/features/explore/demo-data";
import type { Category } from "@/features/restaurants/demo-data";

const mapsUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    url.hostname === "www.google.com" &&
    url.pathname.startsWith("/maps/")
  );
});
export const googlePlaceSchema = z.object({
  id: z.string().regex(/^node\/\d+$/),
  name: z.string().min(1).max(200),
  category: z.string().min(1),
  area: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().nullable(),
  rating: z.number().min(1).max(5),
  reviewCount: z.number().int().positive(),
  photoUrl: z
    .url()
    .refine(
      (value) =>
        /^lh[3-6]\.googleusercontent\.com$/.test(new URL(value).hostname) &&
        !/^\/a-?\//.test(new URL(value).pathname),
    ),
  photoPath: z
    .string()
    .regex(/^\/google-places\/node-\d+(?:-[a-f0-9]{8})?\.(jpg|png|webp)$/),
  hours: z
    .array(
      z.object({
        day: z.enum([
          "Senin",
          "Selasa",
          "Rabu",
          "Kamis",
          "Jumat",
          "Sabtu",
          "Minggu",
        ]),
        text: z.string().min(1).max(120),
      }),
    )
    .max(7),
  reviews: z
    .array(
      z.object({
        author: z.string().min(1),
        authorUrl: mapsUrl.refine((value) =>
          new URL(value).pathname.startsWith("/maps/contrib/"),
        ),
        rating: z.number().int().min(1).max(5),
        excerpt: z.string().min(1).max(1000),
      }),
    )
    .length(5),
  reviewsCheckedAt: z.iso.datetime().optional(),
  mapsUrl,
  checkedAt: z.iso.datetime(),
  matchDistanceM: z.number().min(0).max(400),
});
export type GooglePlace = z.infer<typeof googlePlaceSchema>;
export const googlePlaces = z
  .array(googlePlaceSchema)
  .min(1)
  .max(40)
  .parse(snapshot);
if (new Set(googlePlaces.map((place) => place.id)).size !== googlePlaces.length)
  throw new Error("Duplicate place IDs");
export function findGooglePlace(slug: string) {
  return googlePlaces.find((place) => `osm-${place.id.slice(5)}` === slug);
}
export const areaNames: Record<string, string> = {
  "blok-m": "Blok M",
  menteng: "Menteng",
  "kelapa-gading": "Kelapa Gading",
  "kota-tua": "Kota Tua",
};
const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
function localTime(now: Date) {
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  return {
    day: parts.find((p) => p.type === "weekday")!.value,
    minutes:
      Number(parts.find((p) => p.type === "hour")!.value) * 60 +
      Number(parts.find((p) => p.type === "minute")!.value),
  };
}
export function openingLabel(
  place: Pick<GooglePlace, "hours">,
  now = new Date(),
) {
  const day = localTime(now).day;
  const hours = place.hours.find((row) => row.day === day)?.text;
  return hours ? `Hari ini · ${hours}` : "Jam buka belum tersedia";
}
export function isOpenAt(
  place: Pick<GooglePlace, "hours">,
  now: Date,
): boolean | undefined {
  const { day, minutes } = localTime(now);
  const today = place.hours.find((row) => row.day === day)?.text;
  const previous = place.hours.find(
    (row) => row.day === days[(days.indexOf(day) + 6) % 7],
  )?.text;
  const periods = (text: string) =>
    [
      ...text.matchAll(/(\d{1,2})[.:](\d{2})\s*[–-]\s*(\d{1,2})[.:](\d{2})/g),
    ].map(
      (m) =>
        [
          Number(m[1]) * 60 + Number(m[2]),
          Number(m[3]) * 60 + Number(m[4]),
        ] as const,
    );
  if (
    previous &&
    periods(previous).some(([start, end]) => end < start && minutes < end)
  )
    return true;
  if (!today) return undefined;
  if (/24\s*jam/i.test(today)) return true;
  if (/tutup/i.test(today)) return false;
  const ranges = periods(today);
  if (!ranges.length) return undefined;
  return ranges.some(([start, end]) =>
    end < start ? minutes >= start : minutes >= start && minutes < end,
  );
}
export function distanceFromBlokM(
  place: Pick<GooglePlace, "latitude" | "longitude">,
) {
  const r = Math.PI / 180,
    a = -6.244 * r,
    b = place.latitude * r;
  return (
    6371000 *
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((b - a) / 2) ** 2 +
          Math.cos(a) *
            Math.cos(b) *
            Math.sin(((place.longitude - 106.8) * r) / 2) ** 2,
      ),
    )
  );
}
export function matchesCategory(place: GooglePlace, category: Category) {
  const value = `${place.name} ${place.category}`.toLocaleLowerCase("id");
  const patterns: Record<Exclude<Category, "All">, RegExp> = {
    Coffee: /kopi|coffee|kafe|café/,
    Matcha: /matcha/,
    Japanese: /jepang|japanese|sushi|ramen/,
    Korean: /korea|korean/,
    Indonesian: /indonesia|sunda|sate|gultik|manado|padang|betawi/,
    Western: /burger|barat|steak|hotdog/,
    Dessert: /donut|donat|dessert|kue/,
    Brunch: /brunch/,
  };
  return category === "All" || patterns[category].test(value);
}
export function filterGooglePlaces(
  filters: ExploreFilters,
  savedIds: string[] = [],
  now = new Date(),
) {
  const q = filters.query.toLocaleLowerCase("id");
  const rows = googlePlaces.filter(
    (place) =>
      filters.city === "jakarta" &&
      matchesCategory(place, filters.category) &&
      `${place.name} ${place.category} ${areaNames[place.area]} ${place.address ?? ""}`
        .toLocaleLowerCase("id")
        .includes(q) &&
      (!filters.minRating || place.rating >= filters.minRating) &&
      (!filters.savedOnly || savedIds.includes(place.id)) &&
      (!filters.openNow || isOpenAt(place, now) === true) &&
      (!filters.distance ||
        distanceFromBlokM(place) <= filters.distance * 1000),
  );
  if (filters.sort === "highest_rated")
    rows.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  if (filters.sort === "most_reviewed")
    rows.sort((a, b) => b.reviewCount - a.reviewCount);
  if (filters.sort === "nearest")
    rows.sort((a, b) => distanceFromBlokM(a) - distanceFromBlokM(b));
  return rows;
}
