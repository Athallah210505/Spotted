export const radii = [1, 3, 5, 10] as const;
export type Radius = (typeof radii)[number];

export function parseMapOptions(
  params: Record<string, string | string[] | undefined>,
) {
  const radius = typeof params.radius === "string" ? Number(params.radius) : 5;
  return {
    radius: radii.includes(radius as Radius)
      ? (radius as Radius)
      : (5 as Radius),
    map: params.view === "map",
  };
}
