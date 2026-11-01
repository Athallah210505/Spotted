import type { GooglePlace } from "./google-data";
export type FoodPlace = {
  id: string;
  name: string;
  city: string;
  district: string;
  category: string;
  cuisine: string;
  latitude: number;
  longitude: number;
  address: string | null;
  rating: number | null;
  reviewCount: number | null;
  photoPath: string | null;
  hours: GooglePlace["hours"];
  mapsUrl: string;
};
export type FoodResults = {
  places: FoodPlace[];
  total: number;
  databaseTotal: number;
  nextOffset: number | null;
};
export type MapSpot = {
  latitude: number;
  longitude: number;
  count: number;
  place?: Pick<FoodPlace, "id" | "name" | "rating" | "reviewCount">;
  members?: Pick<FoodPlace, "id" | "name">[];
};
