import "server-only";

import { parseEnv, serverEnvSchema } from "./env-schema";

export function getServerEnv() {
  return parseEnv(serverEnvSchema, {
    APP_ORIGIN: process.env.APP_ORIGIN,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    PAID_APIS_ENABLED: process.env.PAID_APIS_ENABLED,
    GOOGLE_PLACES_DAILY_CALL_LIMIT: process.env.GOOGLE_PLACES_DAILY_CALL_LIMIT,
  });
}
