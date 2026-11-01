import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/places/route";
import {
  clusterMapPlaces,
  foodCatalog,
  searchFoodPlaces,
} from "@/features/catalog/food-catalog";
import {
  cravingMatch,
  cravingTraits,
} from "@/features/explore/craving-matcher";
import { parseExploreFilters } from "@/features/explore/demo-data";

const request = (query = "") =>
  new Request(`http://localhost/api/places?${query}`);
describe("full food catalog", () => {
  it("reads the collected database, paginates without repeating IDs and leaves unknown ratings empty", async () => {
    expect(foodCatalog().databaseTotal).toBe(25907);
    expect(foodCatalog().places.length).toBeGreaterThan(25000);
    expect(foodCatalog().places.some((p) => p.rating === null)).toBe(true);
    const first = await GET(request()).json();
    const next = await GET(request(`offset=${first.nextOffset}`)).json();
    expect(first.places).toHaveLength(24);
    expect(first.total).toBe(foodCatalog().places.length);
    expect(
      new Set([...first.places, ...next.places].map((p) => p.id)).size,
    ).toBe(48);
    expect(
      searchFoodPlaces(parseExploreFilters({ rating: "4.5" })).every(
        (p) => p.rating !== null && p.rating >= 4.5,
      ),
    ).toBe(true);
  });
  it("validates hostile pagination, malformed quiz and invalid geography", () => {
    for (const query of [
      "offset=-1",
      "limit=9999",
      "quiz=101",
      "view=map&bounds=bad&zoom=14",
      "view=count&lat=NaN&lon=2&radius=1",
    ])
      expect(GET(request(query)).status).toBe(400);
  });
  it("counts clusters without dropping venues or overlapping marker anchors", () => {
    const places = foodCatalog().places.slice(0, 1500);
    const zoom = 14,
      scale = 256 * 2 ** zoom;
    const clusters = clusterMapPlaces(places, zoom);
    expect(clusters.reduce((sum, c) => sum + c.count, 0)).toBe(places.length);
    expect(clusters.length).toBeLessThan(places.length);
    const projected = clusters.map((p) => ({
      x: ((p.longitude + 180) / 360) * scale,
      y:
        (0.5 -
          Math.log(
            (1 + Math.sin((p.latitude * Math.PI) / 180)) /
              (1 - Math.sin((p.latitude * Math.PI) / 180)),
          ) /
            (4 * Math.PI)) *
        scale,
    }));
    for (let i = 0; i < projected.length; i++)
      for (let j = i + 1; j < projected.length; j++)
        expect(
          Math.abs(projected[i]!.x - projected[j]!.x) >= 88 ||
            Math.abs(projected[i]!.y - projected[j]!.y) >= 56,
        ).toBe(true);
    const detailed = clusterMapPlaces(
      places
        .slice(0, 3)
        .map((p) => ({ ...p, latitude: -6.24, longitude: 106.8 })),
      19,
    );
    expect(detailed[0]?.members).toHaveLength(3);
  });
  it("changes recommendation ranking with answers and never treats unknown cuisine as a match", async () => {
    const blank = { name: "Tempat", category: "food", cuisine: "" };
    const bakery = cravingTraits({
      name: "Holland Bakery Hayam Wuruk",
      category: "bakery",
      cuisine: "",
    });
    expect(bakery[0]).toBe(false);
    expect(bakery[1]).toBe(null);
    expect(cravingTraits(blank)).toEqual([null, null, null, null, null]);
    expect(
      cravingMatch(blank, [false, false, false, false, false]).reasons,
    ).toHaveLength(0);
    const meal = await GET(request("limit=5&quiz=11000")).json();
    const sweet = await GET(request("limit=5&quiz=00001")).json();
    expect(meal.places.map((p: { id: string }) => p.id)).not.toEqual(
      sweet.places.map((p: { id: string }) => p.id),
    );
    expect(
      cravingMatch(meal.places[0], [true, true, false, false, false]).score,
    ).toBeGreaterThan(0);
  });
});
