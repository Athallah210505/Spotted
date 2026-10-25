import { googlePlaces } from "@/features/catalog/google-data";
export function GET() {
  return Response.json(
    { schemaVersion: 2, source: "Google Maps", places: googlePlaces },
    { headers: { "Cache-Control": "no-store" } },
  );
}
