import unittest
import json
import tempfile
from pathlib import Path
from unittest.mock import patch

from enrich_jaksel_candidates import address_evidence, inspect, name_evidence, summarize


class CandidateEvidenceTests(unittest.TestCase):
    def test_name_accents_ampersand_and_restaurant_abbreviation(self):
        for source, google in [
            ("CasaLeña", "Casalena Jakarta"),
            ("HAKŪJI Tearoom", "Hakuji Tearoom"),
            ("Tide and Table", "Tide & Table Restaurant"),
            ("Rumah Makan Sepakat", "R.M. Sepakat"),
        ]:
            self.assertTrue(name_evidence(source, google))
        self.assertFalse(name_evidence("GIGA Bites", "Little Contrast Gandaria"))

    def test_branch_street_and_number_are_not_just_the_same_city(self):
        self.assertTrue(address_evidence("Jl. Ciputat Raya No.5, Pondok Pinang", "Jl. Ciputat Raya No.5, Jakarta 12310"))
        self.assertTrue(address_evidence("Jl. Kemang Selatan 1, Bangka", "Jl. Kemang Selatan I No.5, Jakarta"))
        self.assertFalse(address_evidence("Jl. Senopati No.52", "Jl. Senopati No.25, Jakarta Selatan"))
        self.assertFalse(address_evidence("Jl. Wijaya No.5", "Jl. Kemang No.5, Jakarta Selatan"))
        self.assertFalse(address_evidence("Jl. Wijaya No.5", "Jl. Wijaya No.5, Bandung"))

    def test_search_results_and_closed_listings_are_not_publishable(self):
        for html, status in [
            ("<h1>Hasil</h1>", "unresolved_search"),
            ("<h1>Known Place</h1><span class='fCEvvc'>Tutup permanen</span>", "closed"),
            ("<h1>Known Place</h1><span class='fCEvvc'>Temporarily closed</span>", "closed"),
            ("<h1>Known Place</h1>", "missing_coordinates"),
        ]:
            self.assertEqual(inspect({"html": html, "url": "https://www.google.com/maps/search/test", "checkedAt": "2026-10-28T00:00:00.000Z"})["status"], status)

    def test_coordinate_inheritance_requires_the_same_named_branch_address(self):
        candidate = {"id": "manual-test", "name": "Test Cafe", "address": "Jl. Test No.10, Jakarta Selatan", "area": "Test", "sourceUrl": "https://manual.co.id/directory/test/"}
        def reviews(start):
            return [{"author": f"Test {i}", "authorUrl": f"https://www.google.com/maps/contrib/{i}/reviews", "rating": 5, "excerpt": "Test fixture"} for i in range(start, start + 3)]
        first = {"status": "captured", "name": "Test Cafe", "address": candidate["address"], "latitude": -6.22, "longitude": 106.8, "cid": None, "reviewCount": 30, "rating": 4.5, "photoUrl": "https://lh3.googleusercontent.com/p/test", "hours": [], "reviews": reviews(1), "url": "https://www.google.com/maps/search/test", "checkedAt": "2026-10-28T00:00:00.000Z", "language": "id"}
        second = {**first, "status": "missing_coordinates", "latitude": None, "longitude": None, "language": "en", "reviews": reviews(4)}
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            (path / "manual-test-id.json").write_text(json.dumps({"capture": "first"}))
            (path / "manual-test-en.json").write_text(json.dumps({"capture": "second"}))
            for address, status in [(candidate["address"], "ready"), ("Jl. Test No.11, Jakarta Selatan", "needs_fields")]:
                fixture = {"first": first, "second": {**second, "address": address}}
                with patch("enrich_jaksel_candidates.inspect", side_effect=lambda raw: dict(fixture[raw["capture"]])):
                    result = summarize([candidate], path)[0]
                self.assertEqual(result["status"], status)
                self.assertEqual(result["google"]["latitude"], first["latitude"])


if __name__ == "__main__":
    unittest.main()
