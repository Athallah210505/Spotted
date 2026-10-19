import { describe, expect, it } from "vitest";

import {
  parseEnv,
  publicEnvSchema,
  serverEnvSchema,
} from "@/config/env-schema";

describe("environment configuration", () => {
  it("runs the local foundation without external credentials", () => {
    expect(parseEnv(publicEnvSchema, {})).toEqual({});
    expect(parseEnv(serverEnvSchema, {})).toEqual({
      APP_ORIGIN: "http://localhost:3000",
      PAID_APIS_ENABLED: "false",
      GOOGLE_PLACES_DAILY_CALL_LIMIT: 0,
    });
  });

  it("treats blank template credentials as unconfigured", () => {
    const env = parseEnv(publicEnvSchema, {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeUndefined();
  });

  it("rejects a partially configured Supabase connection", () => {
    expect(() =>
      parseEnv(publicEnvSchema, {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow("Invalid environment configuration");
  });

  it("does not enable paid requests for the string false", () => {
    expect(
      parseEnv(serverEnvSchema, { PAID_APIS_ENABLED: "false" })
        .PAID_APIS_ENABLED,
    ).toBe("false");
  });

  it("requires a key and a positive limit before enabling paid requests", () => {
    expect(() =>
      parseEnv(serverEnvSchema, { PAID_APIS_ENABLED: "true" }),
    ).toThrow();
    expect(() =>
      parseEnv(serverEnvSchema, {
        PAID_APIS_ENABLED: "true",
        GOOGLE_PLACES_API_KEY: "test-server-key",
        GOOGLE_PLACES_DAILY_CALL_LIMIT: "0",
      }),
    ).toThrow();
    expect(
      parseEnv(serverEnvSchema, {
        PAID_APIS_ENABLED: "true",
        GOOGLE_PLACES_API_KEY: "test-server-key",
        GOOGLE_PLACES_DAILY_CALL_LIMIT: "10",
      }).GOOGLE_PLACES_DAILY_CALL_LIMIT,
    ).toBe(10);
  });

  it("rejects invalid flag and numeric values", () => {
    for (const input of [
      { PAID_APIS_ENABLED: "yes" },
      { GOOGLE_PLACES_DAILY_CALL_LIMIT: "-1" },
      { GOOGLE_PLACES_DAILY_CALL_LIMIT: "NaN" },
    ]) {
      expect(() => parseEnv(serverEnvSchema, input)).toThrow();
    }
  });

  it("reports variable names without exposing supplied values", () => {
    expect(() =>
      parseEnv(publicEnvSchema, {
        NEXT_PUBLIC_SUPABASE_URL: "sensitive-invalid-value",
      }),
    ).toThrow("Invalid environment configuration: NEXT_PUBLIC_SUPABASE_URL");
    try {
      parseEnv(publicEnvSchema, {
        NEXT_PUBLIC_SUPABASE_URL: "sensitive-invalid-value",
      });
    } catch (error) {
      expect(String(error)).not.toContain("sensitive-invalid-value");
    }
  });
});
