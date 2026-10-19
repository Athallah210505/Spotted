import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url({ protocol: /^https?$/ }).optional(),
);

export const publicEnvSchema = z
  .object({
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalText,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: optionalText,
    NEXT_PUBLIC_GOOGLE_MAP_ID: optionalText,
    NEXT_PUBLIC_POSTHOG_KEY: optionalText,
    NEXT_PUBLIC_POSTHOG_HOST: optionalUrl,
  })
  .superRefine((env, context) => {
    if (
      Boolean(env.NEXT_PUBLIC_SUPABASE_URL) !==
      Boolean(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    ) {
      context.addIssue({
        code: "custom",
        path: [
          "NEXT_PUBLIC_SUPABASE_URL",
          "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        ],
        message: "Configure both Supabase values together.",
      });
    }
  });

export const serverEnvSchema = z
  .object({
    APP_ORIGIN: z
      .url({ protocol: /^https?$/ })
      .default("http://localhost:3000"),
    GOOGLE_PLACES_API_KEY: optionalText,
    PAID_APIS_ENABLED: z.enum(["true", "false"]).default("false"),
    GOOGLE_PLACES_DAILY_CALL_LIMIT: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(0),
  })
  .superRefine((env, context) => {
    if (env.PAID_APIS_ENABLED === "true") {
      if (!env.GOOGLE_PLACES_API_KEY) {
        context.addIssue({
          code: "custom",
          path: ["GOOGLE_PLACES_API_KEY"],
          message: "Paid API access requires a server key.",
        });
      }
      if (env.GOOGLE_PLACES_DAILY_CALL_LIMIT === 0) {
        context.addIssue({
          code: "custom",
          path: ["GOOGLE_PLACES_DAILY_CALL_LIMIT"],
          message: "Paid API access requires an explicit positive call limit.",
        });
      }
    }
  });

export function parseEnv<T extends z.ZodType>(
  schema: T,
  input: unknown,
): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const keys = result.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Invalid environment configuration: ${keys}`);
  }
  return result.data;
}
