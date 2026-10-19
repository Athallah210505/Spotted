import {
  categories,
  demoRestaurants,
  type Category,
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
};

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
  };
}

export function exploreSearch(filters: ExploreFilters) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category !== "All") params.set("category", filters.category);
  if (filters.city !== "jakarta") params.set("city", filters.city);
  return params.toString();
}

export function filterDemoRestaurants(filters: ExploreFilters) {
  const query = filters.query.toLocaleLowerCase("en");
  return demoRestaurants.filter(
    (place) =>
      (filters.category === "All" || place.category === filters.category) &&
      (filters.city !== "tangsel" || place.city === "tangsel") &&
      `${place.name} ${place.category} ${place.area}`
        .toLocaleLowerCase("en")
        .includes(query),
  );
}
