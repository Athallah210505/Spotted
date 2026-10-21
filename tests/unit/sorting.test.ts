import { describe, expect, it } from "vitest";
import {
  demoRestaurants,
  exploreSearch,
  filterDemoRestaurants,
  parseExploreFilters,
  sortDemoRestaurants,
} from "@/features/explore/demo-data";
import { detailNavigation } from "@/features/explore/detail-navigation";

describe("discovery sorting and return navigation", () => {
  it("whitelists sort values and round-trips them with filters", () => {
    expect(parseExploreFilters({ sort: ["nearest"] }).sort).toBeUndefined();
    expect(parseExploreFilters({ sort: "__proto__" }).sort).toBeUndefined();
    expect(parseExploreFilters({ sort: "unknown" }).sort).toBeUndefined();
    const filters = parseExploreFilters({
      q: "ramen",
      rating: "4.5",
      saved: "1",
      sort: "most_reviewed",
    });
    expect(
      parseExploreFilters(
        Object.fromEntries(new URLSearchParams(exploreSearch(filters))),
      ),
    ).toEqual(filters);
  });
  it("uses the confirmed weighted formula, counts, distance and deterministic ties without changing input", () => {
    const base = demoRestaurants[0]!;
    const places = [
      {
        ...base,
        id: "low-volume",
        rating: "5.0",
        ratingCount: 1,
        distanceM: 500,
      },
      {
        ...base,
        id: "trusted",
        rating: "4.8",
        ratingCount: 1000,
        distanceM: 1000,
      },
    ];
    expect(sortDemoRestaurants(places, "recommended")[0]?.id).toBe("trusted");
    expect(sortDemoRestaurants(places, "most_reviewed")[0]?.id).toBe("trusted");
    expect(sortDemoRestaurants(places, "highest_rated")[0]?.id).toBe(
      "low-volume",
    );
    expect(sortDemoRestaurants(places, "nearest")[0]?.id).toBe("low-volume");
    expect(places[0]?.id).toBe("low-volume");
    expect(
      sortDemoRestaurants(
        [
          { ...base, id: "b" },
          { ...base, id: "a" },
        ],
        "recommended",
      ).map((p) => p.id),
    ).toEqual(["a", "b"]);
    expect(
      filterDemoRestaurants(parseExploreFilters({ sort: "nearest" }))[0]?.id,
    ).toBe("kopi-halaman");
    expect(sortDemoRestaurants(places, "nearest", false)[0]?.id).toBe(
      "low-volume",
    );
  });
  it("preserves safe filter, selected-marker and radius state for detail and saved screens", () => {
    const nav = detailNavigation("kedai-ramen-sore", {
      from: "wishlist",
      view: "map",
      radius: "3",
      sort: "nearest",
      place: "kedai-ramen-sore",
      city: "jakarta",
    });
    expect(nav.backHref).toBe(
      "/wishlist?city=jakarta&sort=nearest&radius=3&view=map&place=kedai-ramen-sore",
    );
    expect(nav.savedHref).toContain(
      "/saved/kedai-ramen-sore?city=jakarta&sort=nearest",
    );
    expect(nav.sectionHrefs.menu).toContain("from=wishlist");
    expect(
      detailNavigation("kedai-ramen-sore", {
        from: "https://evil.example",
        place: "unknown",
        sort: "javascript:alert(1)",
      }).backHref,
    ).toBe("/explore");
  });
});
