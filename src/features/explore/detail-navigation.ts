import { exploreSearch, parseExploreFilters } from "./demo-data";
import { findDemoRestaurant } from "@/features/restaurants/demo-data";
import { parseMapOptions } from "@/features/maps/map-options";

export function detailNavigation(
  id: string,
  query: Record<string, string | string[] | undefined>,
) {
  const filters = exploreSearch(
    parseExploreFilters(query),
    query.city === "jakarta",
  );
  const returnPage =
    query.from === "map" || query.from === "wishlist" ? query.from : "explore";
  const returnParams = new URLSearchParams(filters);
  const options = parseMapOptions(query);
  if (
    returnPage !== "explore" &&
    (options.radius !== 5 || query.radius === "5")
  )
    returnParams.set("radius", String(options.radius));
  if (returnPage === "wishlist" && options.map) returnParams.set("view", "map");
  if (
    returnPage !== "explore" &&
    typeof query.place === "string" &&
    findDemoRestaurant(query.place)
  )
    returnParams.set("place", query.place);
  const backHref = `/${returnPage}${returnParams.size ? `?${returnParams}` : ""}`;
  if (returnPage !== "explore") returnParams.set("from", returnPage);
  const search = returnParams.toString();
  const base = `/restaurant/${id}`;
  return {
    backHref,
    backLabel: `Back to ${returnPage === "map" ? "Map" : returnPage === "wishlist" ? "Wishlist" : "Explore"}`,
    savedHref: `/saved/${id}${search ? `?${search}` : ""}`,
    sectionHrefs: {
      menu: `${base}${search ? `?${search}` : ""}`,
      reviews: `${base}?${search ? `${search}&` : ""}tab=reviews`,
      tiktok: `${base}?${search ? `${search}&` : ""}tab=tiktok`,
    },
  };
}
