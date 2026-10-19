import { describe, expect, it } from "vitest";
import { parseMapOptions } from "@/features/maps/map-options";

describe("map URL options", () => {
  it("accepts only supported radii and the map view", () => {
    for (const radius of [1, 3, 5, 10])
      expect(parseMapOptions({ radius: String(radius), view: "map" })).toEqual({
        radius,
        map: true,
      });
  });
  it("rejects invalid, negative, repeated and unsupported radii", () => {
    for (const radius of [
      undefined,
      "",
      "NaN",
      "Infinity",
      "-1",
      "2",
      ["1", "10"],
    ])
      expect(parseMapOptions({ radius, view: ["map", "list"] })).toEqual({
        radius: 5,
        map: false,
      });
  });
});
