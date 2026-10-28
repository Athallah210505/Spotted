import { z } from "zod";

const mapsUrl = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    url.hostname === "www.google.com" &&
    url.pathname.startsWith("/maps/")
  );
});
export const googlePlaceSchema = z
  .object({
    id: z.string().regex(/^(?:node\/\d+|jaksel\/[a-z0-9-]+)$/),
    name: z.string().min(1).max(200),
    category: z.string().min(1),
    area: z.string(),
    areaLabel: z.string().min(1).max(100).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().nullable(),
    rating: z.number().min(1).max(5),
    reviewCount: z.number().int().positive(),
    photoUrl: z
      .url()
      .refine(
        (value) =>
          /^lh[3-6]\.googleusercontent\.com$/.test(new URL(value).hostname) &&
          !/^\/a-?\//.test(new URL(value).pathname),
      ),
    photoPath: z
      .string()
      .regex(
        /^\/google-places\/(?:node-\d+|jaksel-[a-z0-9-]+)(?:-[a-f0-9]{8})?\.(jpg|png|webp)$/,
      ),
    hours: z
      .array(
        z.object({
          day: z.enum([
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
            "Minggu",
          ]),
          text: z.string().min(1).max(120),
        }),
      )
      .max(7),
    reviews: z
      .array(
        z.object({
          author: z.string().min(1),
          authorUrl: mapsUrl.refine((value) =>
            new URL(value).pathname.startsWith("/maps/contrib/"),
          ),
          rating: z.number().int().min(1).max(5),
          excerpt: z.string().min(1).max(1000),
        }),
      )
      .length(5),
    reviewsCheckedAt: z.iso.datetime().optional(),
    description: z.string().max(600).optional(),
    menuPhotos: z
      .array(
        z.object({
          name: z.string().min(1).max(100),
          photoPath: z
            .string()
            .regex(/^\/google-menus\/node-\d+-[a-f0-9]{8}\.(jpg|png|webp)$/),
          photoUrl: z
            .url()
            .refine(
              (value) =>
                /^lh[3-6]\.googleusercontent\.com$/.test(
                  new URL(value).hostname,
                ) && !/^\/a-?\//.test(new URL(value).pathname),
            ),
          author: z.string().min(1),
          authorUrl: mapsUrl.refine((value) =>
            new URL(value).pathname.startsWith("/maps/contrib/"),
          ),
          sourceUrl: mapsUrl,
          checkedAt: z.iso.datetime(),
        }),
      )
      .max(4)
      .default([]),
    mapsUrl,
    checkedAt: z.iso.datetime(),
    matchDistanceM: z.number().min(0).max(400).optional(),
    branchVerification: z
      .object({
        method: z.literal("name-and-address"),
        sourceUrl: z.url().refine((value) => {
          const url = new URL(value);
          return (
            url.protocol === "https:" &&
            url.hostname === "manual.co.id" &&
            url.pathname.startsWith("/directory/")
          );
        }),
        sourceAddress: z.string().min(1),
        googleAddress: z.string().min(1),
        coordinateSourceUrl: mapsUrl.optional(),
        reviewSourceUrls: z.array(mapsUrl).min(1).max(10).optional(),
        checkedAt: z.iso.datetime(),
      })
      .optional(),
  })
  .superRefine((place, context) => {
    if (place.id.startsWith("node/") && place.matchDistanceM === undefined)
      context.addIssue({
        code: "custom",
        message: "OSM branches require a measured coordinate match",
      });
    if (
      place.id.startsWith("jaksel/") &&
      (!place.branchVerification ||
        !place.areaLabel ||
        !place.address ||
        place.branchVerification.googleAddress !== place.address)
    )
      context.addIssue({
        code: "custom",
        message:
          "Jaksel branches require source-backed name/address verification",
      });
  });
