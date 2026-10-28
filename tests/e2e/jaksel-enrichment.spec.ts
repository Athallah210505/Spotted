import { expect, test } from "@playwright/test";
import published from "../../src/features/catalog/data/google-places.json" with { type: "json" };
import { stubMapTiles } from "./map-fixture";

test("new Jaksel places flow through Explore, five reviews and Wishlist", async ({
  page,
}) => {
  const additions = published.filter((place) => place.id.startsWith("jaksel/"));
  expect(additions.length).toBeGreaterThan(0);
  for (const place of additions.slice(0, 3)) {
    await page.goto(`/explore?q=${encodeURIComponent(place.name)}`);
    const card = page.getByRole("article", { name: place.name, exact: true });
    await expect(card).toBeVisible();
    const photo = card.getByRole("img", { name: place.name, exact: true });
    await expect
      .poll(() => photo.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    const slug = place.id.replace("/", "-");
    await card
      .getByRole("link", { name: `View ${place.name}`, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/restaurant/${slug}\\?`));
    await expect(
      page.getByRole("heading", { name: place.name, exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Reviews", exact: true }).click();
    const reviews = page.getByRole("region", {
      name: "Reviews tempat",
      exact: true,
    });
    await expect(reviews.getByRole("article")).toHaveCount(5);
    await expect(
      reviews.getByRole("link", {
        name: place.reviews[0]!.author,
        exact: true,
      }),
    ).toHaveAttribute("href", place.reviews[0]!.authorUrl);
    await page
      .getByRole("link", { name: "Back to restaurant", exact: true })
      .click();
    await page
      .getByRole("button", { name: `Bookmark ${place.name}`, exact: true })
      .click();
    await page.getByRole("link", { name: "Back", exact: true }).click();
    await page.getByRole("link", { name: "Wishlist", exact: true }).click();
    await expect(
      page.getByRole("article", { name: place.name, exact: true }),
    ).toBeVisible();
  }
});

test("new Jaksel coordinates have an internal Map detail destination", async ({
  page,
}) => {
  await stubMapTiles(page);
  const place = published.find((row) => row.id.startsWith("jaksel/"))!;
  expect(place).toBeTruthy();
  await page.goto("/map");
  const map = page.getByRole("region", {
    name: "Peta tempat makan",
    exact: true,
  });
  const marker = map.locator(".leaflet-marker-icon[title]");
  await expect(marker).toHaveCount(published.length);
  const point = map.locator(
    `.leaflet-marker-icon[title=${JSON.stringify(place.name)}]`,
  );
  await point.focus();
  await point.press("Enter");
  await expect(
    map.getByRole("link", { name: "Lihat detail", exact: true }),
  ).toHaveAttribute(
    "href",
    `/restaurant/${place.id.replace("/", "-")}?from=map`,
  );
});
