import unittest
import io
from contextlib import redirect_stderr
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from urllib.error import HTTPError

from import_catalog import AREAS, WEBSITE, build_snapshot, inspect_website, main, normalize, parse_website, public_url


class CatalogImportTests(unittest.TestCase):
    def element(self, **values):
        return {"type": "node", "id": 1, "lat": -6.244, "lon": 106.8, "tags": {"name": "Example", "amenity": "cafe"}, **values}

    def test_normalize_rejects_invalid_data_and_keeps_missing_fields_empty(self):
        rows = normalize([self.element(), self.element(), self.element(id=2, lat=float("nan")), self.element(id=3, lon=100), self.element(id=4, tags={"amenity": "cafe"}), self.element(id=5, type="way")], AREAS[0], "2026-10-25T00:00:00Z")
        self.assertEqual(len(rows), 1)
        self.assertIsNone(rows[0]["address"])
        self.assertIsNone(rows[0]["openingHours"])
        self.assertEqual(rows[0]["sourceUrl"], "https://www.openstreetmap.org/node/1")
        self.assertNotIn("rating", rows[0])

    def test_external_urls_reject_credentials_private_hosts_and_unsafe_protocols(self):
        for url in ["javascript:alert(1)", "https://localhost/", "https://127.0.0.1/", "https://user:pass@example.com", "https://example.com:123", "https://service.internal/"]:
            self.assertIsNone(public_url(url))
        self.assertEqual(public_url("https://cafebatavia.com/"), "https://cafebatavia.com/")

    def test_scrapling_extracts_only_source_title_and_same_host_menu(self):
        result = parse_website('<title>Example page</title><a href="https://evil.example/menu">Other menu</a><a href="#section-menu">Menu</a>')
        self.assertEqual(result, {"pageTitle": "Example page", "menuUrl": "https://cafebatavia.com/#section-menu"})
        self.assertEqual(parse_website("<p>No metadata</p>"), {"pageTitle": None, "menuUrl": None})

    def test_snapshot_does_not_accept_silently_empty_areas(self):
        with self.assertRaises(ValueError):
            build_snapshot({area[0]: {"elements": []} for area in AREAS}, "2026-10-25T00:00:00Z")

    def test_snapshot_caps_each_area_and_preserves_distinct_named_branches(self):
        raw = {}
        for index, (slug, _, bounds) in enumerate(AREAS):
            west, south, east, north = bounds
            raw[slug] = {"elements": [self.element(id=index * 100 + n + 1, lat=(south + north) / 2, lon=(west + east) / 2) for n in range(12)]}
        snapshot = build_snapshot(raw, "2026-10-25T00:00:00Z")
        self.assertEqual(len(snapshot["places"]), 40)
        self.assertTrue(all(area["eligiblePointCount"] == 12 and area["selectedCount"] == 10 for area in snapshot["areas"]))

    @patch("import_catalog.fetch")
    def test_website_robot_denial_or_rate_limit_stops_before_page_fetch(self, fetch):
        fetch.return_value = ("User-agent: *\nDisallow: /", 200)
        self.assertEqual(inspect_website()["status"], "robots_disallowed")
        self.assertEqual(fetch.call_count, 1)
        fetch.reset_mock()
        fetch.side_effect = HTTPError(WEBSITE, 429, "rate limited", {}, None)
        result = inspect_website()
        self.assertEqual(result["robotsStatus"], 429)
        self.assertIsNone(result["pageTitle"])
        self.assertEqual(fetch.call_count, 1)

    @patch("import_catalog.fetch")
    def test_missing_robots_and_successful_page_keep_metadata_provenance(self, fetch):
        fetch.side_effect = [HTTPError(WEBSITE, 404, "not found", {}, None), ('<title>Batavia</title><a href="#section-menu">Menu</a>', 200)]
        result = inspect_website()
        self.assertEqual(result["sourceUrl"], WEBSITE)
        self.assertEqual(result["robotsStatus"], 404)
        self.assertEqual(result["httpStatus"], 200)
        self.assertEqual(result["status"], "fetched")
        self.assertEqual(result["menuUrl"], WEBSITE + "#section-menu")

    def test_network_failure_keeps_the_previous_snapshot(self):
        with TemporaryDirectory() as folder:
            output = Path(folder) / "snapshot.json"
            output.write_text("previous snapshot")
            with patch("import_catalog.OUTPUT", output), patch("import_catalog.fetch", side_effect=OSError("network unavailable")), patch("sys.argv", ["import_catalog.py"]), redirect_stderr(io.StringIO()):
                with self.assertRaises(SystemExit) as error:
                    main()
            self.assertEqual(error.exception.code, 1)
            self.assertEqual(output.read_text(), "previous snapshot")


if __name__ == "__main__":
    unittest.main()
