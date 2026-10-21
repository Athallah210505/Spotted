import { EmailSentPage } from "@/features/tiktok/email-sent-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  return <EmailSentPage fromImport={query.from === "import"} />;
}
