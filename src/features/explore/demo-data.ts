import {
  categories,
  demoRestaurants,
  type Category,
  type DemoRestaurant,
} from "@/features/restaurants/demo-data";
export {
  categories,
  demoRestaurants,
  type DemoRestaurant,
} from "@/features/restaurants/demo-data";

export type ExploreFilters = {
  query: string;
  category: Category;
  city: "jakarta" | "tangsel";
  minRating?: 4 | 4.5;
  distance?: 1 | 3 | 5 | 10;
  price?: 1 | 2 | 3;
  openNow?: true;
  halalOnly?: true;
  savedOnly?: true;
  sort?: Sort;
};

export const sortOptions = {
  recommended: "Recommended",
  highest_rated: "Highest Rated",
  most_reviewed: "Most Reviewed",
  nearest: "Nearest",
} as const;
export type Sort = keyof typeof sortOptions;

export function parseExploreFilters(
  params: Record<string, string | string[] | undefined>,
): ExploreFilters {
  const category =
    typeof params.category === "string" &&
    categories.includes(params.category as Category)
      ? (params.category as Category)
      : "All";
  return {
    query: typeof params.q === "string" ? params.q.trim().slice(0, 120) : "",
    category,
    city: params.city === "tangsel" ? "tangsel" : "jakarta",
    ...(params.rating === "4" || params.rating === "4.5"
      ? { minRating: Number(params.rating) as 4 | 4.5 }
      : {}),
    ...(typeof params.distance === "string" &&
    ["1", "3", "5", "10"].includes(params.distance)
      ? { distance: Number(params.distance) as 1 | 3 | 5 | 10 }
      : {}),
    ...(typeof params.price === "string" &&
    ["1", "2", "3"].includes(params.price)
      ? { price: Number(params.price) as 1 | 2 | 3 }
      : {}),
    ...(params.open === "1" ? { openNow: true as const } : {}),
    ...(params.halal === "1" ? { halalOnly: true as const } : {}),
    ...(params.saved === "1" ? { savedOnly: true as const } : {}),
    ...(typeof params.sort === "string" &&
    Object.hasOwn(sortOptions, params.sort)
      ? { sort: params.sort as Sort }
      : {}),
  };
}

export function exploreSearch(
  filters: ExploreFilters,
  explicitJakarta = false,
) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category !== "All") params.set("category", filters.category);
  if (filters.city !== "jakarta" || explicitJakarta)
    params.set("city", filters.city);
  if (filters.minRating) params.set("rating", String(filters.minRating));
  if (filters.distance) params.set("distance", String(filters.distance));
  if (filters.price) params.set("price", String(filters.price));
  if (filters.openNow) params.set("open", "1");
  if (filters.halalOnly) params.set("halal", "1");
  if (filters.savedOnly) params.set("saved", "1");
  if (filters.sort) params.set("sort", filters.sort);
  return params.toString();
}

export function filterDemoRestaurants(
  filters: ExploreFilters,
  savedIds: string[] = [],
) {
  const query = filters.query.toLocaleLowerCase("en");
  const places = demoRestaurants.filter(
    (place) =>
      (filters.category === "All" || place.category === filters.category) &&
      (filters.city !== "tangsel" || place.city === "tangsel") &&
      (!filters.minRating || Number(place.rating) >= filters.minRating) &&
      (!filters.distance ||
        (filters.city === "jakarta" &&
          place.distanceM <= filters.distance * 1000)) &&
      (!filters.price || place.priceLevel === filters.price) &&
      (!filters.openNow || place.openNow === true) &&
      (!filters.halalOnly || place.halalVerified === true) &&
      (!filters.savedOnly || savedIds.includes(place.id)) &&
      `${place.name} ${place.category} ${place.area}`
        .toLocaleLowerCase("en")
        .includes(query),
  );
  return sortDemoRestaurants(places, filters.sort, filters.city === "jakarta");
}

export function sortDemoRestaurants(
  places: DemoRestaurant[],
  sort: Sort = "highest_rated",
  originKnown = true,
) {
  const mean =
    demoRestaurants.reduce((sum, place) => sum + Number(place.rating), 0) /
    demoRestaurants.length;
  const weighted = (place: DemoRestaurant) =>
    (place.ratingCount * Number(place.rating) + 100 * mean) /
    (place.ratingCount + 100);
  return [...places].sort((a, b) => {
    const rating = Number(b.rating) - Number(a.rating);
    const count = b.ratingCount - a.ratingCount;
    if (sort === "recommended")
      return (
        weighted(b) - weighted(a) || count || a.id.localeCompare(b.id, "en")
      );
    if (sort === "most_reviewed")
      return count || rating || a.id.localeCompare(b.id, "en");
    if (sort === "nearest" && originKnown)
      return (
        a.distanceM - b.distanceM || rating || a.id.localeCompare(b.id, "en")
      );
    return rating || count || a.id.localeCompare(b.id, "en");
  });
}
