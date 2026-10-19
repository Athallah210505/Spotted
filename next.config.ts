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
