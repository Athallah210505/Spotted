import type { NextConfig } from "next";

import {
  parseEnv,
  publicEnvSchema,
  serverEnvSchema,
} from "./src/config/env-schema";

parseEnv(publicEnvSchema, process.env);
parseEnv(serverEnvSchema, process.env);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/api/places": ["./research/jaksel-jakbar-2026-10-28/food-database.sqlite"],
    "/restaurant/[placeId]": [
      "./research/jaksel-jakbar-2026-10-28/food-database.sqlite",
    ],
  },
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
