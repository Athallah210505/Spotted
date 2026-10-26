import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import {
  googlePlaces,
  googlePlaceSchema,
  findGooglePlace,
  openingLabel,
  isOpenAt,
  filterGooglePlaces,
  distanceFromBlokM,
  distanceBetween,
} from "@/features/catalog/google-data";
import { parseExploreFilters } from "@/features/explore/demo-data";

describe("published Google place data", () => {
  it("measures radius from any selected point without changing the Blok M origin", () => {
    const origin = { latitude: 0, longitude: 0 };
    expect(distanceBetween(origin, origin)).toBe(0);
    expect(distanceBetween(origin, { latitude: 0, longitude: 1 })).toBeCloseTo(
      111194.9266,
      2,
    );
    const tuku = findGooglePlace("osm-12110042118")!;
    expect(distanceFromBlokM(tuku)).toBe(
      distanceBetween({ latitude: -6.244, longitude: 106.8 }, tuku),
    );
  });
  it("keeps menu photos tied to real review authors and existing local dish images", () => {
    const photos = googlePlaces.flatMap((place) => place.menuPhotos);
    expect(photos).toHaveLength(16);
    for (const photo of photos) {
      expect(existsSync(`public${photo.photoPath}`)).toBe(true);
      expect(readFileSync(`public${photo.photoPath}`).length).toBeGreaterThan(
        5000,
      );
      expect(new URL(photo.authorUrl).pathname).toMatch(/^\/maps\/contrib\//);
      expect(photo.name).not.toMatch(/interior|storefront|profile/i);
    }
    expect(findGooglePlace("osm-12110042118")!.menuPhotos[0]!.name).toBe(
      "Kopi Susu Tetangga",
    );
  });
  it("publishes only matched branches with downloaded photos, real ratings and short attributed excerpts", () => {
    expect(googlePlaces).toHaveLength(37);
    for (const place of googlePlaces) {
      expect(place.matchDistanceM).toBeLessThanOrEqual(400);
      expect(place.reviewCount).toBeGreaterThan(0);
      expect(existsSync(`public${place.photoPath}`)).toBe(true);
      expect(readFileSync(`public${place.photoPath}`).length).toBeGreaterThan(
        5000,
      );
      expect(new URL(place.photoUrl).hostname).toMatch(
        /^lh[3-6]\.googleusercontent\.com$/,
      );
      expect(new URL(place.photoUrl).pathname).not.toMatch(/^\/a-?\//);
      expect(findGooglePlace(`osm-${place.id.slice(5)}`)).toEqual(place);
      expect(place.reviews).toHaveLength(5);
      expect(
        new Set(
          place.reviews.map((review) => new URL(review.authorUrl).pathname),
        ).size,
      ).toBe(5);
      expect(place.reviews[0]!.excerpt.split(/\s+/).length).toBeLessThanOrEqual(
        15,
      );
      expect(new URL(place.reviews[0]!.authorUrl).pathname).toMatch(
        /^\/maps\/contrib\//,
      );
    }
    const tuku = findGooglePlace("osm-12110042118")!;
    expect(tuku.rating).toBe(4.8);
    expect(tuku.reviewCount).toBe(2450);
    expect(findGooglePlace("osm-4245907143")!.rating).toBe(4.5);
    expect(findGooglePlace("osm-0000")).toBeUndefined();
  });
  it("rejects untrusted image hosts, invalid ratings, bad file paths and distant branches", () => {
    const row = googlePlaces[0]!;
    for (const value of [
      { rating: 9 },
      { photoUrl: "https://evil.example/photo.jpg" },
      { photoPath: "/../../secret" },
      { mapsUrl: "javascript:alert(1)" },
      { matchDistanceM: 401 },
    ])
      expect(googlePlaceSchema.safeParse({ ...row, ...value }).success).toBe(
        false,
      );
  });
  it("formats weekly hours and respects the lunch break and closing boundary in Jakarta", () => {
    const tuku = findGooglePlace("osm-12110042118")!;
    expect(openingLabel(tuku, new Date("2026-10-25T05:00:00Z"))).toBe(
      "Hari ini · 07.00–21.00",
    );
    expect(isOpenAt(tuku, new Date("2026-10-30T03:00:00Z"))).toBe(true);
    expect(isOpenAt(tuku, new Date("2026-10-30T05:00:00Z"))).toBe(false);
    expect(isOpenAt(tuku, new Date("2026-10-30T06:00:00Z"))).toBe(true);
    expect(isOpenAt(tuku, new Date("2026-10-25T14:00:00Z"))).toBe(false);
    expect(isOpenAt({ hours: [] }, new Date())).toBeUndefined();
    const overnight = {
      hours: [
        { day: "Sabtu" as const, text: "20.00–02.00" },
        { day: "Minggu" as const, text: "Tutup" },
      ],
    };
    expect(isOpenAt(overnight, new Date("2026-10-24T18:00:00Z"))).toBe(true);
    expect(isOpenAt(overnight, new Date("2026-10-24T20:00:00Z"))).toBe(false);
  });
  it("searches and sorts actual ratings, counts, saved state and distances instead of fixtures", () => {
    expect(
      filterGooglePlaces(parseExploreFilters({ q: "tuku" })).map((p) => p.name),
    ).toEqual(["Toko Kopi TUKU - Blok M"]);
    expect(
      filterGooglePlaces(parseExploreFilters({ saved: "1" }), [
        googlePlaces[0]!.id,
      ]),
    ).toHaveLength(1);
    expect(
      filterGooglePlaces(parseExploreFilters({ city: "tangsel" })),
    ).toHaveLength(0);
    expect(
      filterGooglePlaces(parseExploreFilters({ q: "none-xyz" })),
    ).toHaveLength(0);
    const rated = filterGooglePlaces(
      parseExploreFilters({ rating: "4.5", sort: "highest_rated" }),
    );
    expect(rated.every((p) => p.rating >= 4.5)).toBe(true);
    expect(rated.map((p) => p.rating)).toEqual(
      rated.map((p) => p.rating).sort((a, b) => b - a),
    );
    const reviewed = filterGooglePlaces(
      parseExploreFilters({ sort: "most_reviewed" }),
    );
    expect(reviewed.map((p) => p.reviewCount)).toEqual(
      reviewed.map((p) => p.reviewCount).sort((a, b) => b - a),
    );
    expect(
      filterGooglePlaces(parseExploreFilters({ distance: "1" })).every(
        (p) => distanceFromBlokM(p) <= 1000,
      ),
    ).toBe(true);
  });
});
