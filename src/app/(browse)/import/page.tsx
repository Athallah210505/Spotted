import { ImportPage } from "@/features/tiktok/import-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return (
    <ImportPage
      key={query.step === "confirm" ? "confirm" : "link"}
      step={query.step === "confirm" ? "confirm" : "link"}
    />
  );
}
