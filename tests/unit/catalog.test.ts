import { describe, expect, it } from "vitest";
import {
  catalog,
  catalogSchema,
  filterCatalog,
  findCatalogPlace,
} from "@/features/catalog/catalog";
import { existsSync } from "node:fs";
import {
  catalogPhotos,
  catalogRatings,
  catalogDetailHref,
  googleMapsUrl,
} from "@/features/catalog/catalog-media";

describe("real OSM pilot catalogue", () => {
  it("links every source coordinate to Maps and keeps photo credits tied to existing places", () => {
    for (const place of catalog.places) {
      const url = new URL(googleMapsUrl(place));
      expect(url.origin).toBe("https://www.google.com");
      expect(url.pathname).toBe("/maps/search/");
      expect(url.searchParams.get("api")).toBe("1");
      expect(url.searchParams.get("query")).toBe(
        `${place.latitude},${place.longitude}`,
      );
      expect(url.searchParams.has("query_place_id")).toBe(false);
      expect(catalogDetailHref(place)).toBe(
        `/restaurant/osm-${place.id.slice(5)}`,
      );
      expect(
        findCatalogPlace(catalogDetailHref(place).split("/").pop()!),
      ).toEqual(place);
    }
    expect(findCatalogPlace("osm-0000")).toBeUndefined();
    for (const [id, photo] of Object.entries(catalogPhotos)) {
      expect(catalog.places.some((place) => place.id === id)).toBe(true);
      expect(existsSync(`public${photo.src}`)).toBe(true);
      expect(new URL(photo.sourceUrl).hostname).toBe("www.google.com");
    }
  });
  it("keeps an attributed rating snapshot separate from OSM and leaves unknown ratings missing", () => {
    const rating = catalogRatings["node/4245907143"]!;
    expect(rating.value).toBe(4.5);
    expect(rating.reviewCount).toBeGreaterThan(9000);
    expect(rating.provider).toBe("Google");
    expect(new URL(rating.sourceUrl).hostname).toBe("www.google.com");
    expect(Number.isFinite(Date.parse(rating.checkedAt))).toBe(true);
    expect(catalogRatings["node/000000"]).toBeUndefined();
    for (const [id, item] of Object.entries(catalogRatings)) {
      expect(catalog.places.some((place) => place.id === id)).toBe(true);
      expect(item.value).toBeGreaterThanOrEqual(0);
      expect(item.value).toBeLessThanOrEqual(5);
    }
  });
  it("contains unique source-linked points inside four declared sample areas", () => {
    expect(catalog.places).toHaveLength(40);
    expect(catalog.areas).toHaveLength(4);
    expect(new Set(catalog.places.map((p) => p.id)).size).toBe(40);
    expect(catalog.license).toBe("ODbL-1.0");
    expect(
      catalog.places.every(
        (p) => p.sourceUrl === `https://www.openstreetmap.org/${p.id}`,
      ),
    ).toBe(true);
    expect(catalog.places.some((p) => p.address === null)).toBe(true);
    expect(
      catalog.places.every(
        (p) => !("rating" in p) && !("image" in p) && !("halalVerified" in p),
      ),
    ).toBe(true);
    const batavia = catalog.places.find((p) => p.id === "node/4245907143");
    expect(batavia?.websiteInspection?.sourceUrl).toBe(
      "https://cafebatavia.com/",
    );
    expect(batavia?.websiteInspection?.menuUrl).toBe(
      "https://cafebatavia.com/#section-menu",
    );
  });
  it("rejects corrupt source identity, duplicate records and out-of-area points", () => {
    const first = catalog.places[0]!;
    for (const bad of [
      { ...first, sourceUrl: "https://evil.example" },
      { ...first, longitude: 100 },
      { ...first, website: "javascript:alert(1)" },
    ]) {
      expect(
        catalogSchema.safeParse({
          ...catalog,
          places: [bad, ...catalog.places.slice(1)],
        }).success,
      ).toBe(false);
    }
    expect(
      catalogSchema.safeParse({
        ...catalog,
        places: [first, ...catalog.places.slice(0, -1)],
      }).success,
    ).toBe(false);
  });
  it("filters actual records by name/area/kind and ignores unsupported or repeated parameters", () => {
    const batavia = filterCatalog({ q: " batavia " });
    expect(batavia.query).toBe("batavia");
    expect(batavia.places.some((p) => p.name === "Cafe Batavia")).toBe(true);
    expect(filterCatalog({ area: "blok-m" }).places).toHaveLength(10);
    expect(filterCatalog({ q: "zxqv-no-such-place" }).places).toEqual([]);
    expect(
      filterCatalog({ q: ["Batavia"], area: "unknown", kind: "__proto__" })
        .places,
    ).toHaveLength(40);
    expect(filterCatalog({ q: "a".repeat(200) }).query).toHaveLength(120);
  });
});
