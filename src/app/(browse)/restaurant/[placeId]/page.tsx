import { notFound } from "next/navigation";

import {
  exploreSearch,
  parseExploreFilters,
} from "@/features/explore/demo-data";
import { findDemoRestaurant } from "@/features/restaurants/demo-data";
import { parseMapOptions } from "@/features/maps/map-options";
import { RestaurantDetail } from "@/features/restaurants/restaurant-detail";
import { DetailSaveButton } from "@/features/wishlist/detail-save-button";

export default async function RestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ placeId }, query] = await Promise.all([params, searchParams]);
  const place = findDemoRestaurant(placeId);
  if (!place) notFound();
  const tab =
    query.tab === "reviews" || query.tab === "tiktok" ? query.tab : "menu";
  const filters = exploreSearch(parseExploreFilters(query));
  const returnPage =
    query.from === "map" || query.from === "wishlist" ? query.from : "explore";
  const returnParams = new URLSearchParams(filters);
  const options = parseMapOptions(query);
  if (returnPage !== "explore" && options.radius !== 5)
    returnParams.set("radius", String(options.radius));
  if (returnPage === "wishlist" && options.map) returnParams.set("view", "map");
  const backHref = `/${returnPage}${returnParams.size ? `?${returnParams}` : ""}`;
  const sectionParams = new URLSearchParams(returnParams);
  if (returnPage !== "explore") sectionParams.set("from", returnPage);
  const search = sectionParams.toString();
  const base = `/restaurant/${place.id}`;
  const menuHref = `${base}${search ? `?${search}` : ""}`;
  return (
    <RestaurantDetail
      key={`${place.id}:${tab}`}
      place={place}
      tab={tab}
      backHref={backHref}
      backLabel={`Back to ${returnPage === "map" ? "Map" : returnPage === "wishlist" ? "Wishlist" : "Explore"}`}
      sectionHrefs={{
        menu: menuHref,
        reviews: `${base}?${search ? `${search}&` : ""}tab=reviews`,
        tiktok: `${base}?${search ? `${search}&` : ""}tab=tiktok`,
      }}
      saveAction={<DetailSaveButton id={place.id} name={place.name} />}
    />
  );
}
