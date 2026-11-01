import { expect, test } from "@playwright/test";
import { stubMapTiles } from "./map-fixture";

test("full database is searchable and paginated; a newly available place opens detail", async ({
  page,
}) => {
  const response = await page.request.get("/api/places");
  const catalog = await response.json();
  expect(catalog.total).toBeGreaterThan(25000);
  expect(catalog.databaseTotal).toBe(25907);
  await page.goto("/explore");
  await expect(page.getByRole("article")).toHaveCount(24);
  await expect(
    page.getByText(
      `${catalog.total.toLocaleString("en-US")} places · Recommended`,
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Lihat lebih banyak tempat", exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveCount(48);
  const rows = await (
    await page.request.get("/api/places?offset=120&limit=1")
  ).json();
  const place = rows.places[0];
  await page.goto(`/explore?q=${encodeURIComponent(place.name)}`);
  const card = page
    .getByRole("article", { name: place.name, exact: true })
    .first();
  await expect(card).toBeVisible();
  await card
    .getByRole("link", { name: `View ${place.name}`, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: place.name, level: 1, exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Reviews", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Reviews tempat", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/explore\?q=/);
});

test("five-question game accepts left/right swipes, buttons, restart and real detail results", async ({
  page,
}) => {
  await page.goto("/explore");
  await page.getByRole("button", { name: /Bingung makan apa/ }).click();
  const dialog = page.getByRole("dialog");
  const question = dialog.getByRole("group", {
    name: "Kartu pertanyaan",
    exact: true,
  });
  await expect(
    dialog.getByText("Pertanyaan 1 dari 5", { exact: true }),
  ).toBeVisible();
  for (const [index, direction] of [1, -1].entries()) {
    const box = (await question.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + direction * 90, box.y + 100, {
      steps: 8,
    });
    await page.mouse.up();
    await expect(
      dialog.getByText(`Pertanyaan ${index + 2} dari 5`, { exact: true }),
    ).toBeVisible();
  }
  await dialog
    .getByRole("button", { name: "Kembali satu pertanyaan", exact: true })
    .click();
  await expect(
    dialog.getByText("Pertanyaan 2 dari 5", { exact: true }),
  ).toBeVisible();
  for (const yes of [true, false, false, true])
    await dialog
      .getByRole("button", { name: yes ? "Ya" : "Tidak", exact: true })
      .click();
  await expect(dialog.getByRole("article")).toHaveCount(5);
  await expect(dialog.getByText(/dari 5 preferensi cocok/)).toHaveCount(5);
  await page.screenshot({
    path: `test-results/craving-results-${test.info().project.name}.png`,
  });
  await dialog.getByRole("button", { name: "Main lagi", exact: true }).click();
  await expect(
    dialog.getByText("Pertanyaan 1 dari 5", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: /Bingung makan apa/ }),
  ).toBeFocused();
});

test("failed recommendations can be retried and filters fit narrow screens", async ({
  page,
}) => {
  for (const width of [320, 375, 430, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/explore");
    await expect(page.getByRole("article")).toHaveCount(24);
    const controls = page.getByRole("navigation", { name: "Explore controls" });
    const box = (await controls.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  let fail = true;
  await page.route("**/api/places?*", (route) =>
    new URL(route.request().url()).searchParams.has("quiz") && fail
      ? route.fulfill({ status: 503, json: { error: "Unavailable" } })
      : route.continue(),
  );
  await page.getByRole("button", { name: /Bingung makan apa/ }).click();
  const dialog = page.getByRole("dialog");
  for (let i = 0; i < 5; i++)
    await dialog.getByRole("button", { name: "Tidak", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  fail = false;
  await dialog.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(dialog.getByRole("article")).toHaveCount(5);
});

for (const entry of ["direct", "explore"] as const) {
  test(`map loads database clusters with centered labels via ${entry}`, async ({
    page,
  }) => {
    await stubMapTiles(page);
    if (entry === "explore") {
      await page.goto("/explore");
      await page.getByRole("link", { name: "Map", exact: true }).click();
    } else await page.goto("/map");
    const map = page.getByRole("region", { name: "Peta tempat makan" });
    await expect
      .poll(async () => Number(await map.getAttribute("data-places")))
      .toBeGreaterThan(104);
    const markers = map.locator(".leaflet-marker-icon");
    expect(await markers.count()).toBeLessThan(100);
    const boxes = await markers.evaluateAll((nodes) =>
      nodes.map((node) => {
        const r = node.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!,
          b = boxes[j]!;
        expect(
          a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y,
        ).toBe(true);
      }
    const zoom = map.getByRole("button", {
      name: "Perbesar peta",
      exact: true,
    });
    await expect(zoom).toHaveCSS("width", "44px");
    await expect(zoom).toHaveCSS("height", "44px");
    const offsets = await markers.evaluateAll((nodes) =>
      nodes.map((node) => {
        const marker = node.getBoundingClientRect();
        const text = node.querySelector("span")!.getBoundingClientRect();
        return {
          x: Math.abs(text.x + text.width / 2 - marker.x - marker.width / 2),
          y: Math.abs(text.y + text.height / 2 - marker.y - marker.height / 2),
        };
      }),
    );
    for (const offset of offsets) {
      expect(offset.x).toBeLessThanOrEqual(1);
      expect(offset.y).toBeLessThanOrEqual(1);
    }
    await page.screenshot({
      path: `test-results/food-clusters-${test.info().project.name}.png`,
    });
    await map
      .getByRole("button", { name: /tempat, perbesar area/ })
      .first()
      .click();
    await expect(map).toHaveAttribute("data-zoom", "16");
  });
}
