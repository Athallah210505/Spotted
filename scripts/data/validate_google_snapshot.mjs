import { readFile } from "node:fs/promises";
import { z } from "zod";
import { googlePlaceSchema } from "../../src/features/catalog/google-place-schema.ts";

const file = process.argv[2];
if (!file)
  throw new Error(
    "Usage: node scripts/data/validate_google_snapshot.mjs snapshot.json",
  );
const places = z
  .array(googlePlaceSchema)
  .min(1)
  .max(200)
  .parse(JSON.parse(await readFile(file, "utf8")));
if (new Set(places.map((place) => place.id)).size !== places.length)
  throw new Error("Duplicate place IDs");
for (const place of places) {
  if (
    new Set(place.reviews.map((review) => new URL(review.authorUrl).pathname))
      .size !== 5
  )
    throw new Error(`Duplicate review author: ${place.id}`);
  await readFile(`public${place.photoPath}`);
}
console.log(`Validated ${places.length} complete source-backed places`);
