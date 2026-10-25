import { catalog } from "@/features/catalog/catalog";
import {
  catalogPhotos,
  catalogRatings,
  catalogDetailHref,
  googleMapsUrl,
} from "@/features/catalog/catalog-media";

export function GET() {
  return Response.json({
    ...catalog,
    places: catalog.places.map((place) => ({
      ...place,
      photo: catalogPhotos[place.id] ?? null,
      googleMapsUrl: googleMapsUrl(place),
      detailUrl: catalogDetailHref(place),
      sourceRating: catalogRatings[place.id] ?? null,
    })),
  });
}
