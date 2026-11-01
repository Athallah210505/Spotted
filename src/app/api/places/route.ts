import { distanceBetween } from "@/features/catalog/google-data";
import { parseExploreFilters } from "@/features/explore/demo-data";
import {
  foodCatalog,
  searchFoodPlaces,
  clusterMapPlaces,
} from "@/features/catalog/food-catalog";

export const runtime = "nodejs";
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const offset = Number(params.get("offset") ?? 0);
  const limit = Number(params.get("limit") ?? 24);
  const quiz = params.get("quiz");
  const savedIds = (params.get("ids") ?? "").split(",").filter(Boolean);
  if (
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 100000 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 48 ||
    (quiz !== null && !/^[01]{5}$/.test(quiz)) ||
    savedIds.length > 200
  )
    return Response.json(
      { error: "Parameter pencarian tidak valid." },
      { status: 400 },
    );
  try {
    const all = searchFoodPlaces(
      parseExploreFilters(Object.fromEntries(params)),
      savedIds,
      quiz?.split("").map((v) => v === "1"),
    );
    if (params.get("view") === "count") {
      const latitude = Number(params.get("lat")),
        longitude = Number(params.get("lon")),
        radius = Number(params.get("radius"));
      if (
        !params.has("lat") ||
        !params.has("lon") ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180 ||
        ![1, 3, 5, 10].includes(radius)
      )
        return Response.json({ error: "Lokasi tidak valid." }, { status: 400 });
      return Response.json(
        {
          total: all.filter(
            (p) => distanceBetween({ latitude, longitude }, p) <= radius * 1000,
          ).length,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    if (params.get("view") === "map") {
      const bounds = (params.get("bounds") ?? "").split(",").map(Number);
      const zoom = Number(params.get("zoom"));
      if (
        bounds.length !== 4 ||
        !bounds.every(Number.isFinite) ||
        bounds[0]! < -180 ||
        bounds[2]! > 180 ||
        bounds[1]! < -85 ||
        bounds[3]! > 85 ||
        bounds[0]! >= bounds[2]! ||
        bounds[1]! >= bounds[3]! ||
        !Number.isInteger(zoom) ||
        zoom < 1 ||
        zoom > 19
      )
        return Response.json(
          { error: "Batas peta tidak valid." },
          { status: 400 },
        );
      const visible = all.filter(
        (p) =>
          p.longitude >= bounds[0]! &&
          p.longitude <= bounds[2]! &&
          p.latitude >= bounds[1]! &&
          p.latitude <= bounds[3]!,
      );
      return Response.json(
        { spots: clusterMapPlaces(visible, zoom), total: visible.length },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      {
        places: all.slice(offset, offset + limit),
        total: all.length,
        databaseTotal: foodCatalog().databaseTotal,
        nextOffset: offset + limit < all.length ? offset + limit : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Food catalog read failed",
      error instanceof Error ? error.message : "Unknown database error",
    );
    return Response.json(
      { error: "Data tempat belum bisa dimuat. Coba lagi." },
      { status: 503 },
    );
  }
}
