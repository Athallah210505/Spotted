import { notFound } from "next/navigation";
import { findDemoRestaurant } from "@/features/restaurants/demo-data";

export default async function SavedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  if (!findDemoRestaurant(placeId)) notFound();
  return children;
}
