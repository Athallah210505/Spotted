import unittest
import sqlite3
from contextlib import closing

from build_food_database import normalize_hours, discovery_seed, FOLDER, address, category, contains, eligible, geometry, google_category, source_name


def segment(points, role="outer"):
    return {"type": "way", "role": role, "geometry": [{"lon": x, "lat": y} for x, y in points]}


class FoodDatabaseTests(unittest.TestCase):
    def test_split_boundary_and_hole_do_not_accept_bbox_only_points(self):
        boundary = geometry({"id": 1, "tags": {"name": "Test"}, "members": [
            segment([(0, 0), (4, 0), (4, 4)]), segment([(0, 0), (0, 4), (4, 4)]),
            segment([(1, 1), (2, 1), (2, 2), (1, 2), (1, 1)], "inner"),
        ]})
        self.assertTrue(contains(boundary, 3, 3))
        self.assertFalse(contains(boundary, 1.5, 1.5))
        self.assertFalse(contains(boundary, 5, 2))
        with self.assertRaises(ValueError):
            geometry({"id": 1, "tags": {"name": "Broken"}, "members": [segment([(0, 0), (1, 1)])]})

    def test_only_food_tags_and_source_addresses_are_used(self):
        self.assertFalse(eligible({"shop": "clothes"}))
        self.assertTrue(eligible({"amenity": "post_office", "shop": "bakery"}))
        self.assertEqual(category({"amenity": "post_office", "shop": "bakery"}), "bakery")
        self.assertEqual(google_category("Restoran Jepang"), "restaurant")
        self.assertEqual(google_category("Kedai Kopi"), "cafe")
        self.assertIsNone(address({"name": "Unknown address"}))
        self.assertEqual(address({"addr:street": "Jalan A", "addr:housenumber": "5"}), "Jalan A 5")
        self.assertEqual(source_name({'name:ja': '置屋'}), '置屋')
        self.assertEqual(source_name({'name': ' ', 'name:hi': 'Kantin MangkuLuhur City'}), 'Kantin MangkuLuhur City')
        self.assertIsNone(source_name({'brand': 'KOI', 'operator': 'Example'}))

    def test_english_hours_are_normalized_without_changing_the_original_capture(self):
        rows = [{'day':'Monday','text':'6.30\u202fam–3.00\u202fpm'},{'day':'Sunday','text':'Closed'},{'day':'Friday','text':'Open 24 hours'}]
        self.assertEqual(normalize_hours(rows),[{'day':'Senin','text':'06.30–15.00'},{'day':'Minggu','text':'Tutup'},{'day':'Jumat','text':'Buka 24 jam'}])
        self.assertEqual(rows[0]['day'],'Monday')

    def test_discovery_promotion_requires_branch_identity_and_nearby_source(self):
        source = {'id':'abc','name':'Example Ramen','city':'Jakarta Selatan','district':'Tebet','category':'restaurant',
                  'latitude':-6.24,'longitude':106.8,'address':'Jalan A 5','address_locality_conflict':False,'confidence':0.95,
                  'source_url':'https://example.com/source','checked_at':'2026-11-01T00:00:00Z','sources':[]}
        evidence = {'id':'overture/abc','name':'Example Ramen Tebet','sourceRecordName':'Example Ramen','latitude':-6.24,'longitude':106.8}
        place, provenance = discovery_seed(source,evidence)
        self.assertEqual(place['id'], evidence['id'])
        self.assertEqual(provenance['source_id'],'abc')
        for changes in [{'id':'overture/other'},{'name':'Different Business'},{'latitude':-6.25},{'longitude':466.8}]:
            with self.assertRaises(ValueError): discovery_seed(source,{**evidence,**changes})
        for changes in [{'confidence':0.1},{'address_locality_conflict':True}]:
            with self.assertRaises(ValueError): discovery_seed({**source,**changes},evidence)

    def test_database_rejects_orphan_reviews_and_out_of_range_ratings(self):
        with closing(sqlite3.connect(":memory:")) as db, db:
            db.executescript((FOLDER / "schema.sql").read_text())
            with self.assertRaises(sqlite3.IntegrityError):
                db.execute("INSERT INTO google_reviews VALUES (?,?,?,?,?,?,?)", ("missing", "A", "https://example.com/a", 5, "text", "https://example.com", "2026-10-28"))
            with self.assertRaises(sqlite3.IntegrityError):
                db.execute("INSERT INTO places(id,city,district,category,latitude,longitude,coordinate_method,primary_source_url,operating_status,verification_status,observed_at,google_rating) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", ("test", "Jakarta Selatan", "Tebet", "cafe", -6.2, 106.8, "osm_node", "https://example.com", "unknown", "osm_only", "2026-10-28", 7))


if __name__ == "__main__":
    unittest.main()
