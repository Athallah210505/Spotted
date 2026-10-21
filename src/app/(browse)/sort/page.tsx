import { parseExploreFilters } from "@/features/explore/demo-data";
import { SortPage } from "@/features/search/sort-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <SortPage
      filters={parseExploreFilters(query)}
      usePreferredCity={query.city !== "jakarta" && query.city !== "tangsel"}
    />
  );
}
