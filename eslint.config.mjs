import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app", "@/app/**"],
              message:
                "Routes compose features. Import shared code from its owning feature or library instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/lib/**/*.{ts,tsx}",
      "src/config/**/*.{ts,tsx}",
      "src/components/ui/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/app", "@/app/**", "@/features", "@/features/**"],
              message:
                "Shared infrastructure and UI must not import application routes or business features.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/features/restaurants/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/app",
                "@/app/**",
                "@/features/wishlist/**",
                "@/features/maps/**",
                "@/features/tiktok/**",
              ],
              message:
                "Inject personal/map actions from the route composition layer to avoid circular feature dependencies.",
            },
          ],
        },
      ],
    },
  },
]);
