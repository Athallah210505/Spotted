import type { Page } from "@playwright/test";

export async function stubMapTiles(page: Page) {
  // Automated pan/zoom uses local tiles, never the community tile service.
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC1kAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
}
