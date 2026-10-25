import { CatalogPage } from "@/features/catalog/catalog-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogPage params={await searchParams} />;
}
