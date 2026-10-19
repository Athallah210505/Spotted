import { describe, expect, it } from "vitest";

import {
  filterDemoRestaurants,
  parseExploreFilters,
} from "@/features/explore/demo-data";

describe("Explore preview filters", () => {
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
