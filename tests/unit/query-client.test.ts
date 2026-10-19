import { expect, it } from "vitest";

import { createQueryClient } from "@/lib/query/client";

it("isolates query caches between clients and disables automatic paid retries", () => {
  const first = createQueryClient();
  const second = createQueryClient();
  first.setQueryData(["wishlist", "test-user"], ["test-place"]);

  expect(second.getQueryData(["wishlist", "test-user"])).toBeUndefined();
  expect(first.getDefaultOptions().queries).toMatchObject({
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
  });
  expect(first.getDefaultOptions().mutations?.retry).toBe(false);
  first.clear();
  second.clear();
});
