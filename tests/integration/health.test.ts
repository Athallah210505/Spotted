import { expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

it("exposes application liveness without pretending external services are connected", async () => {
  const response = GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual({
    data: { status: "ok", service: "spotted", scope: "application" },
  });
});
