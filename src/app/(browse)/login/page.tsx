import { LoginPage } from "@/features/tiktok/login-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return <LoginPage fromImport={query.from === "import"} />;
}
