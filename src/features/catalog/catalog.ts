import { z } from "zod";
import data from "./data/jakarta-pilot.json";

const url = z.url({ protocol: /^https?$/ });
const date = z.iso.datetime({ offset: true });
const inspection = z.object({
  sourceUrl: url,
  checkedAt: date,
  status: z.enum(["fetched", "unavailable", "robots_disallowed"]),
  httpStatus: z.number().int().nullable(),
  robotsStatus: z.number().int().nullable(),
  pageTitle: z.string().nullable(),
  menuUrl: url.nullable(),
});
const place = z
  .object({
    id: z.string().regex(/^node\/\d+$/),
    name: z.string().min(1),
    area: z.string(),
    kind: z.enum(["restaurant", "cafe", "fast_food", "food_court"]),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().nullable(),
    cuisine: z.string().nullable(),
    openingHours: z.string().nullable(),
    website: url.nullable(),
    sourceUrl: url,
    osmEditedAt: date.nullable(),
    fetchedAt: date,
    websiteInspection: inspection.nullable(),
  })
  .refine(
    (value) => value.sourceUrl === `https://www.openstreetmap.org/${value.id}`,
    "OSM source identity must match the place ID",
  );

export const catalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    fetchedAt: date,
    source: z.literal("OpenStreetMap"),
    license: z.literal("ODbL-1.0"),
    attribution: z.literal("© OpenStreetMap contributors"),
    licenseUrl: z.literal("https://www.openstreetmap.org/copyright"),
    selection: z.string(),
    areas: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          bounds: z.tuple([z.number(), z.number(), z.number(), z.number()]),
          eligiblePointCount: z.number().int().nonnegative(),
          selectedCount: z.number().int().min(1).max(10),
        }),
      )
      .length(4),
    places: z.array(place).min(1).max(40),
  })
  .superRefine((snapshot, context) => {
    if (
      new Set(snapshot.places.map((p) => p.id)).size !== snapshot.places.length
    )
      context.addIssue({ code: "custom", message: "Duplicate OSM IDs" });
    for (const area of snapshot.areas) {
      if (
        snapshot.places.filter((p) => p.area === area.id).length !==
          area.selectedCount ||
        area.selectedCount > area.eligiblePointCount
      )
        context.addIssue({
          code: "custom",
          message: "Area coverage counts do not match",
        });
    }
    for (const row of snapshot.places) {
      const area = snapshot.areas.find((a) => a.id === row.area);
      if (
        !area ||
        row.longitude < area.bounds[0] ||
        row.longitude > area.bounds[2] ||
        row.latitude < area.bounds[1] ||
        row.latitude > area.bounds[3]
      )
        context.addIssue({
          code: "custom",
          message: "Place lies outside its sample area",
        });
    }
  });

// shortcut: a checked-in pilot snapshot; use persisted source records when the dataset and refresh policy are approved.
export const catalog = catalogSchema.parse(data);
export function findCatalogPlace(slug: string) {
  return catalog.places.find(
    (row) => slug === `osm-${row.id.slice("node/".length)}`,
  );
}
export const kindLabels = {
  restaurant: "Restoran",
  cafe: "Cafe",
  fast_food: "Makanan cepat saji",
  food_court: "Food court",
} as const;

export function filterCatalog(
  params: Record<string, string | string[] | undefined>,
) {
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 120) : "";
  const area =
    typeof params.area === "string" &&
    catalog.areas.some((a) => a.id === params.area)
      ? params.area
      : "";
  const kind =
    typeof params.kind === "string" && Object.hasOwn(kindLabels, params.kind)
      ? params.kind
      : "";
  const term = query.toLocaleLowerCase("id");
  return {
    query,
    area,
    kind,
    places: catalog.places.filter(
      (p) =>
        (!area || p.area === area) &&
        (!kind || p.kind === kind) &&
        `${p.name} ${p.address ?? ""} ${p.cuisine ?? ""}`
          .toLocaleLowerCase("id")
          .includes(term),
    ),
  };
}
