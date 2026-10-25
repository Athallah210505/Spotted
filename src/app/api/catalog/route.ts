import { catalog } from "@/features/catalog/catalog";

export function GET() {
  return Response.json(catalog);
}
