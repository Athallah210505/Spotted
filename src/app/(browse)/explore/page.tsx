import { parseExploreFilters } from "@/features/explore/demo-data";
import { ExploreFeed } from "@/features/explore/explore-feed";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <ExploreFeed
      filters={parseExploreFilters(params)}
      usePreferredCity={params.city === undefined}
    />
  );
}
