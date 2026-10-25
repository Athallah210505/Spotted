import { notFound } from "next/navigation";

import { findDemoRestaurant } from "@/features/restaurants/demo-data";
import { findGooglePlace } from "@/features/catalog/google-data";

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  // Validate before the nested loading boundary starts a streaming 200 response.
  if (!findDemoRestaurant(placeId) && !findGooglePlace(placeId)) notFound();
  return children;
}
