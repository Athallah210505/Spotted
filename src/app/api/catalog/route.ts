import { catalog } from "@/features/catalog/catalog";
import { catalogPhotos, googleMapsUrl } from "@/features/catalog/catalog-media";

export function GET() {
  return Response.json({
    ...catalog,
    places: catalog.places.map((place) => ({
      ...place,
      photo: catalogPhotos[place.id] ?? null,
      googleMapsUrl: googleMapsUrl(place),
    })),
  });
}
