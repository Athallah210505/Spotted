import { parseExploreFilters } from "@/features/explore/demo-data";
import { FiltersPage } from "@/features/search/filters-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <FiltersPage
      filters={parseExploreFilters(params)}
      from={params.from === "map" ? "map" : "explore"}
      usePreferredCity={params.city === undefined}
    />
  );
}
