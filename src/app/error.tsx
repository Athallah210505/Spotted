"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-12" role="alert">
      <h1 className="text-2xl font-semibold">Unable to load this page</h1>
      <p className="text-muted-foreground mt-3">
        Try again or return to Explore.
      </p>
      <button
        className="bg-primary text-primary-foreground mt-6 min-h-11 rounded-lg px-4 py-2"
        onClick={reset}
      >
        Try again
      </button>
      <Link
        className="ml-4 inline-block underline underline-offset-4"
        href="/explore"
      >
        Explore
      </Link>
    </main>
  );
}
