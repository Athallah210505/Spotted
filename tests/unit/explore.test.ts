import { describe, expect, it } from "vitest";

import {
  filterDemoRestaurants,
  parseExploreFilters,
  exploreSearch,
} from "@/features/explore/demo-data";

describe("Explore preview filters", () => {
  it("rejects unsupported advanced filter values and repeated parameters", () => {
    expect(
      parseExploreFilters({
        rating: ["4.5"],
        distance: "-1",
        price: "9",
        open: "true",
        halal: ["1"],
        saved: "yes",
      }),
    ).toEqual({ query: "", category: "All", city: "jakarta" });
  });

  it("excludes unknown metadata only when its corresponding filter is active", () => {
    const base = parseExploreFilters({});
    expect(filterDemoRestaurants(base)).toHaveLength(3);
    expect(
      filterDemoRestaurants({ ...base, openNow: true }).map(
        (place) => place.id,
      ),
    ).toEqual(["kedai-ramen-sore"]);
    expect(filterDemoRestaurants({ ...base, halalOnly: true })).toEqual([]);
    expect(filterDemoRestaurants({ ...base, price: 1 })).toEqual([]);
    expect(filterDemoRestaurants({ ...base, price: 2 })).toHaveLength(3);
    expect(
      filterDemoRestaurants({ ...base, distance: 1 }).map((place) => place.id),
    ).toEqual(["kopi-halaman"]);
    expect(
      filterDemoRestaurants({ ...base, city: "tangsel", distance: 10 }),
    ).toEqual([]);
  });

  it("round-trips advanced filters and uses the supplied preview saves", () => {
    const filters = parseExploreFilters({
      q: "ramen",
      rating: "4.5",
      distance: "5",
      price: "2",
      open: "1",
      saved: "1",
    });
    expect(
      parseExploreFilters(
        Object.fromEntries(new URLSearchParams(exploreSearch(filters))),
      ),
    ).toEqual(filters);
    expect(filterDemoRestaurants(filters)).toEqual([]);
    expect(
      filterDemoRestaurants(filters, ["kedai-ramen-sore"]).map(
        (place) => place.id,
      ),
    ).toEqual(["kedai-ramen-sore"]);
  });
  it("normalizes unknown and repeated parameters to safe defaults", () => {
    expect(
      parseExploreFilters({
        category: "unknown",
        city: "unknown",
        q: ["ramen", "coffee"],
      }),
    ).toEqual({ query: "", category: "All", city: "jakarta" });
    expect(
      parseExploreFilters({ q: `  ${"a".repeat(200)}  ` }).query,
    ).toHaveLength(120);
  });

  it("combines query and category instead of overriding either filter", () => {
    const filters = parseExploreFilters({
      q: "  HALAMAN  ",
      category: "Coffee",
    });
    expect(filterDemoRestaurants(filters).map((place) => place.id)).toEqual([
      "kopi-halaman",
    ]);
    expect(filterDemoRestaurants({ ...filters, category: "Japanese" })).toEqual(
      [],
    );
  });

  it("scopes manual Tangsel selection to its illustrative candidate", () => {
    expect(
      filterDemoRestaurants(parseExploreFilters({ city: "tangsel" })).map(
        (place) => place.id,
      ),
    ).toEqual(["ruang-matcha"]);
  });
});
