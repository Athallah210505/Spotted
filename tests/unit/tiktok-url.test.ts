import { describe, expect, it } from "vitest";
import { parseTikTokUrl } from "@/features/tiktok/tiktok-url";

describe("personal TikTok link validation", () => {
  it("accepts only video/share paths and strips tracking parameters", () => {
    expect(
      parseTikTokUrl(
        " https://www.tiktok.com/@food.creator/video/123456?tracking=private#fragment ",
      ),
    ).toBe("https://www.tiktok.com/@food.creator/video/123456");
    expect(parseTikTokUrl("https://vm.tiktok.com/Zabc123/")).toBe(
      "https://vm.tiktok.com/Zabc123/",
    );
    expect(parseTikTokUrl("https://vt.tiktok.com/Zabc123/")).toBe(
      "https://vt.tiktok.com/Zabc123/",
    );
  });
  it("rejects unsafe protocols, credentials, lookalike hosts and non-video URLs", () => {
    for (const input of [
      "",
      "invalid",
      "javascript:alert(1)",
      "http://www.tiktok.com/@food/video/123",
      "https://tiktok.com.evil.com/@food/video/123",
      "https://user:pass@www.tiktok.com/@food/video/123",
      "https://www.tiktok.com:3000/@food/video/123",
      "https://www.tiktok.com/@food",
      "https://vm.tiktok.com/",
      "https://vm.tiktok.com/redirect/elsewhere",
      "https://www.tiktok.com/@food/video/not-a-number",
      "https://www.tiktok.com/@food/video/123?" + "a".repeat(2048),
    ])
      expect(parseTikTokUrl(input)).toBeNull();
  });
});
