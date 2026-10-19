import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link
        className="mt-6 inline-block underline underline-offset-4"
        href="/explore"
      >
        Return to Explore
      </Link>
    </main>
  );
}
