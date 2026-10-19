import { parseExploreFilters } from "@/features/explore/demo-data";
import { DiscoveryPage } from "@/features/maps/discovery-page";
import { parseMapOptions } from "@/features/maps/map-options";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <DiscoveryPage
      wishlist={false}
      mapView
      filters={parseExploreFilters(params)}
      radius={
        params.radius === undefined ? undefined : parseMapOptions(params).radius
      }
      usePreferredCity={params.city === undefined}
      selectedId={typeof params.place === "string" ? params.place : undefined}
    />
  );
}
