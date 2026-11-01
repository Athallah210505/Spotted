"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { FoodResults } from "./food-types";

export function useFoodPlaces(search: string, savedIds: string[]) {
  const ids = [...savedIds].sort().join(",");
  return useInfiniteQuery({
    queryKey: ["food-places", search, ids],
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const params = new URLSearchParams(search);
      params.set("offset", String(pageParam));
      params.set("ids", ids);
      const response = await fetch(`/api/places?${params}`, { signal });
      if (!response.ok) throw new Error("Tempat belum bisa dimuat.");
      return (await response.json()) as FoodResults;
    },
    getNextPageParam: (last) => last.nextOffset ?? undefined,
    staleTime: 60_000,
  });
}
