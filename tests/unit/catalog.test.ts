import { describe, expect, it } from "vitest";
import {
  catalog,
  catalogSchema,
  filterCatalog,
} from "@/features/catalog/catalog";

describe("real OSM pilot catalogue", () => {
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
