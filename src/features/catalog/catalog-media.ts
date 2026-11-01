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
export function googleMapsUrl(place: {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string | null;
  district?: string;
  city?: string;
}) {
  const query = place.name?.trim()
    ? [place.name, place.address || place.district, place.city]
        .filter(Boolean)
        .join(" ")
    : `${place.latitude},${place.longitude}`;
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query })}`;
}
