import unittest
import asyncio
import tempfile
from pathlib import Path
from unittest.mock import patch

from complete_food_database import preserve_assets, blocked, combine, match, result_link, exact_address_match, selected_marker, collect


PLACE = {"id": "node/1", "name": "Test Ramen", "latitude": -6.2, "longitude": 106.8, "address": "Jl. Test No.10"}


def capture(start=1, cid="aaa", lat=-6.2, address="Jl. Test No.10, Jakarta Selatan"):
    reviews = ''.join(f'<div data-review-id="r{i}" aria-label="Author {i}"><span class="wiI7pd">Actual fixture review {i}</span><span role="img" aria-label="5 bintang"></span><button data-href="https://www.google.com/maps/contrib/{i}/reviews"></button></div>' for i in range(start, start + 3))
    return {"url": f"https://www.google.com/maps/place/Test/data=!1s0x123:0x{cid}!3d{lat}!4d106.8", "checkedAt": "2026-10-28T16:00:00.000Z", "httpStatus": 200,
            "html": f'<html lang="id"><h1>Test Ramen</h1><div class="F7nice"><span role="img" aria-label="4,5 bintang"></span>(123)</div><button data-item-id="address" aria-label="Alamat: {address}"></button><button aria-label="Foto Test"><img src="https://lh3.googleusercontent.com/p/example"></button>{reviews}</html>'}


class CompletionTests(unittest.TestCase):
    def test_capture_refresh_preserves_derived_assets_only_for_the_same_listing(self):
        row = {'name':'Test Ramen','googleCid':'aaa','photoUrl':'https://lh3.googleusercontent.com/p/a','latitude':-6.2,'longitude':106.8,'mapsUrl':'https://www.google.com/maps/search/Test+Ramen'}
        previous = {**row,'photoPath':'/google-places/test.jpg','description':'Sourced description','descriptionSourceUrl':'https://example.com/source','menuPhotos':[{'photoPath':'/google-places/menu.jpg'}]}
        self.assertEqual(preserve_assets(dict(row),previous)['photoPath'], previous['photoPath'])
        self.assertEqual(preserve_assets(dict(row),previous)['description'], previous['description'])
        self.assertEqual(preserve_assets({**row,'googleCid':None},{**previous,'googleCid':None})['photoPath'], previous['photoPath'])
        self.assertNotIn('photoPath',preserve_assets({**row,'googleCid':'bbb'},previous))
        self.assertNotIn('photoPath',preserve_assets({**row,'photoUrl':'https://lh3.googleusercontent.com/p/b'},previous))

    def test_same_brand_distant_branch_and_conflicting_number_are_rejected(self):
        self.assertEqual(match(capture(lat=-6.3), PLACE)["status"], "outside_match_radius")
        self.assertEqual(match(capture(address="Jl. Test No.11, Jakarta Selatan"), PLACE)["status"], "address_conflict")
        self.assertEqual(match(capture(), PLACE)["status"], "matched")

    def test_five_reviews_require_distinct_authors_and_matching_listing(self):
        audit, row = combine(PLACE, [capture(), capture(start=3)])
        self.assertEqual(audit["status"], "matched_with_five_reviews")
        self.assertEqual(len(row["reviews"]), 5)
        audit, row = combine(PLACE, [capture(), capture(start=4, cid="bbb")])
        self.assertEqual(audit["status"], "matched_partial")
        self.assertEqual(len(row["reviews"]), 3)

    def test_ambiguous_search_does_not_pick_the_first_branch(self):
        def link(cid):
            return f'<a class="hfpxzc" aria-label="Test Ramen" href="https://www.google.com/maps/place/Test/data=!1s0x123:0x{cid}!3d-6.2!4d106.8"></a>'
        self.assertIsNotNone(result_link({"html": link("aaa")}, PLACE))
        self.assertIsNone(result_link({"html": link("aaa") + link("bbb")}, PLACE))

    def test_blocking_is_reported_without_a_bypass(self):
        self.assertTrue(blocked({"url": "https://www.google.com/maps", "httpStatus": 429, "html": ""}))
        self.assertEqual(match({"url": "https://www.google.com/sorry/index", "html": ""}, PLACE)["status"], "blocked")
        self.assertFalse(blocked({'url': 'https://www.google.com/maps/', 'html': '<body><script>our systems have detected unusual traffic</script><h1>Place</h1></body>'}))

    def test_saved_block_prevents_browser_start_and_network_requests(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            (path / 'provider-blocked.json').write_text('{"httpStatus":429}')
            with patch('playwright.async_api.async_playwright', side_effect=AssertionError('No browser allowed')):
                asyncio.run(collect([PLACE], path, None, None))

    def test_exact_street_number_can_match_without_claiming_google_coordinates(self):
        self.assertTrue(exact_address_match('Jalan Tanjung Duren Raya 57D, Jakarta Barat', 'Jl. Tanjung Duren Raya No.57d, Jakarta Barat'))
        self.assertFalse(exact_address_match('Jalan Tanjung Duren Raya 57D, Jakarta Barat', 'Jl. Tanjung Duren Raya No.58, Jakarta Barat'))
        self.assertFalse(exact_address_match('Pondok Indah Jakarta', 'Pondok Indah Jakarta'))
        raw = capture()
        raw['url'] = 'https://www.google.com/maps/search/Test+Ramen'
        audit, row = combine(PLACE, [raw])
        self.assertEqual(audit['status'], 'matched_partial')
        self.assertIsNone(row['googleLatitude'])
        self.assertEqual(row['latitude'], PLACE['latitude'])
        self.assertEqual(row['matchMethod'], 'name-and-exact-street-number')

    def test_selected_marker_requires_an_observed_google_business_identity(self):
        url = 'https://www.google.com/maps/vt/pb=!2sspotlit!1m2!1y123!2y456!2s%2Fg%2Ftest!4m2!1x4232967296!2x1068000000!15sgcid%3Arestaurant'
        marker = selected_marker({'mapMarkerUrls': [url]})
        self.assertEqual(marker['latitude'], -6.2)
        self.assertEqual(marker['cid'], '1c8')
        self.assertIsNone(selected_marker({'mapMarkerUrls': [url, url.replace('!2y456', '!2y789')]}))
        self.assertIsNone(selected_marker({'mapMarkerUrls': [url.replace('www.google.com', 'example.com')]}))
        raw = capture()
        raw['url'] = 'https://www.google.com/maps/search/Test+Ramen'
        raw['mapMarkerUrls'] = [url]
        self.assertEqual(match(raw, PLACE)['distanceM'], 0)


if __name__ == "__main__":
    unittest.main()
