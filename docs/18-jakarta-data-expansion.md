# Jakarta data expansion

26 October 2026. Five new venues appended to the existing 32 records: **37 places and 185 attributed Google review excerpts**. Existing records were preserved unchanged.

| Place                     | Area     | Google rating | Google reviews | Weekly hours                 |
| ------------------------- | -------- | ------------- | -------------- | ---------------------------- |
| Ayam Goreng Berkah        | Blok M   | 4.6           | 11,210         | Available                    |
| MM Juice Restaurant       | Blok M   | 4.4           | 1,305          | Available                    |
| Afterhour Cikini          | Menteng  | 4.6           | 570            | Not supplied in this capture |
| Padang Merdeka            | Kota Tua | 4.4           | 2,425          | Available                    |
| Bakso Boedjangan Bulungan | Blok M   | 4.4           | 3,918          | Not supplied in this capture |

Collection used the installed `firecrawl-scrapling` skill with ordinary Scrapling dynamic MCP sessions and `headless: true`. No browser windows, paid API key, billing activation, stealth or challenge solving. Public Indonesian and English pages exposed distinct review authors; each new venue retains five unique author sources and individual scores. Both language captures had matching Google coordinates. Venue photo references were downloaded, decoded visually and checked to exclude profile avatars. Source URLs and retrieval timestamps remain in the existing Google snapshot.

Candidates came from the previously captured public OSM point lists, then were checked against Google branch names, addresses and coordinates. The original OSM seed file remains historical. Raw captures and intermediate candidates stay in `/tmp`; they are not committed to the app. Five downloaded photos are added to `public/google-places`.

Gelato Secrets Menteng, ¿Por Qué No? and the selected Coffee Bean branch were excluded because Google marked them permanently closed. Bunga Pepaya, Dapur Cokelat and Holland Bakery queries resolved to locations too far from their candidate points, so those seed IDs were not assigned to different branches. The importer now rejects explicit Google closed-status labels, covered by a focused parser regression test.

The new records flow through the existing Explore, internal detail, five-review section, source Maps link, Wishlist and interactive Map without UI changes. Data counts in existing tests are updated; browser coverage exercises each new venue through Explore → Detail → Reviews. Missing weekly hours stay unknown. Ratings/counts are snapshots, not live Google API data; the original 32 records were not refreshed in this batch.

Validation passed: 31 Node tests, 17 Python tests, 24 focused desktop/mobile browser cases, ESLint, changed-file formatting and production build. Map tests used local tile fixtures and emulated location. The media tests now check membership in the published Google dataset, allowing new verified points outside the historical 40-seed file.
