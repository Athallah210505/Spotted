import { notFound } from "next/navigation";

import { detailNavigation } from "@/features/explore/detail-navigation";
import { findDemoRestaurant } from "@/features/restaurants/demo-data";
import { RestaurantDetail } from "@/features/restaurants/restaurant-detail";
import { DetailSaveButton } from "@/features/wishlist/detail-save-button";
import { SavedRecommendation } from "@/features/tiktok/saved-recommendation";
import { findCatalogPlace } from "@/features/catalog/catalog";
import { CatalogDetail } from "@/features/catalog/catalog-detail";

export default async function RestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ placeId }, query] = await Promise.all([params, searchParams]);
  const realPlace = findCatalogPlace(placeId);
  if (realPlace)
    return (
      <CatalogDetail
        place={realPlace}
        tab={
          query.tab === "menu" || query.tab === "reviews"
            ? query.tab
            : "overview"
        }
        backHref={query.from === "catalog" ? "/catalog" : "/explore"}
      />
    );
  const place = findDemoRestaurant(placeId);
  if (!place) notFound();
  const tab =
    query.tab === "reviews" || query.tab === "tiktok" ? query.tab : "menu";
  const navigation = detailNavigation(place.id, query);
  return (
    <RestaurantDetail
      key={`${place.id}:${tab}`}
      place={place}
      tab={tab}
      backHref={navigation.backHref}
      backLabel={navigation.backLabel}
      sectionHrefs={navigation.sectionHrefs}
      saveAction={
        <DetailSaveButton
          id={place.id}
          name={place.name}
          savedHref={navigation.savedHref}
        />
      }
      heroSaveAction={
        <DetailSaveButton
          id={place.id}
          name={place.name}
          savedHref={navigation.savedHref}
          compact
        />
      }
      personalVideo={<SavedRecommendation placeId={place.id} />}
    />
  );
}
