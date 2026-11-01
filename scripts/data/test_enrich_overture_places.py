import unittest
import struct

from build_food_database import contains, geometry
from enrich_overture_places import indexed_boundary, in_boundary, match_places, address_conflict, culinary
from collect_overture_places import wkb_point


def candidate(identifier='gers-a', confidence=0.9, lat=-6.2):
    return {'id': identifier, 'name': 'Test Ramen', 'city': 'Jakarta Selatan', 'district': 'Tebet',
            'latitude': lat, 'longitude': 106.8, 'address': 'Jalan Test No.10', 'confidence': confidence,
            'address_locality_conflict': False, 'source_url': 'https://example.com/source.parquet'}


class OvertureTests(unittest.TestCase):
    def test_source_geometry_and_food_categories_are_not_guessed(self):
        point = b'\x01' + struct.pack('<I',1) + struct.pack('<dd',106.8,-6.2)
        self.assertEqual(wkb_point(point),(-6.2,106.8))
        with self.assertRaises(ValueError):
            wkb_point(b'not a point')
        self.assertTrue(culinary({'basic_category':'food_and_beverage_store','taxonomy':{'primary':'patisserie_cake_shop','hierarchy':['shopping']}}))
        self.assertFalse(culinary({'basic_category':'food_and_beverage_store','taxonomy':{'primary':'grocery_store','hierarchy':['shopping']}}))
    def test_spatial_index_preserves_holes_and_full_boundary_results(self):
        relation = {'id': 1, 'tags': {'name': 'Test'}, 'members': [
            {'type': 'way', 'role': role, 'geometry': [{'lon': x, 'lat': y} for x,y in points]}
            for role,points in [('outer', [(0,0),(4,0),(4,4),(0,4),(0,0)]), ('inner', [(1,1),(2,1),(2,2),(1,2),(1,1)])]]
        }
        index, original = indexed_boundary(relation), geometry(relation)
        for lat,lon in [(0.5,0.5),(1.5,1.5),(3.999,3.999),(5,3),(-0.001,1)]:
            self.assertEqual(in_boundary(index,lat,lon), contains(original,lat,lon))

    def test_low_confidence_far_or_ambiguous_branches_do_not_fill_addresses(self):
        place = {'id': 'node/1', 'name': 'Test Ramen', 'city': 'Jakarta Selatan', 'district': 'Tebet', 'latitude': -6.2, 'longitude':106.8, 'address':None}
        self.assertEqual(len(match_places([place],[candidate()],{})[0]),1)
        self.assertFalse(match_places([place],[candidate(confidence=0.79)],{})[0])
        self.assertFalse(match_places([place],[candidate(lat=-6.3)],{})[0])
        matches, ambiguous = match_places([place],[candidate(),candidate('gers-b')],{})
        self.assertFalse(matches)
        self.assertEqual(ambiguous[0]['reason'],'multiple_source_branches')

    def test_one_source_cannot_silently_merge_two_existing_records(self):
        base = {'name':'Test Ramen','city':'Jakarta Selatan','district':'Tebet','latitude':-6.2,'longitude':106.8,'address':None}
        matches, ambiguous = match_places([{**base,'id':'node/1'},{**base,'id':'way/2'}],[candidate()],{})
        self.assertFalse(matches)
        self.assertEqual(len(ambiguous),2)
        self.assertTrue(address_conflict('Jl. Test No.10A','Jalan Test No.10B'))


if __name__ == '__main__':
    unittest.main()
