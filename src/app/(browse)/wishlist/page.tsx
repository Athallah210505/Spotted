import { parseExploreFilters } from "@/features/explore/demo-data";
import { DiscoveryPage } from "@/features/maps/discovery-page";
import { parseMapOptions } from "@/features/maps/map-options";

export default async function WishlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const options = parseMapOptions(params);
  return (
    <DiscoveryPage
      wishlist
      mapView={options.map}
      filters={parseExploreFilters(params)}
      radius={params.radius === undefined ? undefined : options.radius}
      usePreferredCity={params.city === undefined}
      selectedId={typeof params.place === "string" ? params.place : undefined}
    />
  );
}
