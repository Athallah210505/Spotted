import { notFound } from "next/navigation";
import { detailNavigation } from "@/features/explore/detail-navigation";
import { findDemoRestaurant } from "@/features/restaurants/demo-data";
import { SavedPage } from "@/features/wishlist/saved-page";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ placeId }, query] = await Promise.all([params, searchParams]);
  const place = findDemoRestaurant(placeId);
  if (!place) notFound();
  return (
    <SavedPage
      place={place}
      restaurantHref={detailNavigation(placeId, query).sectionHrefs.menu}
    />
  );
}
