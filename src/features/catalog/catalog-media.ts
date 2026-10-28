import { googlePlaces, googlePlaceSlug } from "./google-data";

export const catalogRatings = Object.fromEntries(
  googlePlaces.map((place) => [
    place.id,
    {
      value: place.rating,
      reviewCount: place.reviewCount,
      provider: "Google",
      sourceUrl: place.mapsUrl,
      checkedAt: place.checkedAt,
    },
  ]),
);
export const catalogPhotos = Object.fromEntries(
  googlePlaces.map((place) => [
    place.id,
    { src: place.photoPath, alt: place.name, sourceUrl: place.mapsUrl },
  ]),
);
export function catalogDetailHref(place: { id: string }) {
  return `/restaurant/${googlePlaceSlug(place.id)}`;
}
export function googleMapsUrl(place: { latitude: number; longitude: number }) {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${place.latitude},${place.longitude}` })}`;
}
