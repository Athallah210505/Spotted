import unittest
from enrich_google_reviews import merge_reviews


class ReviewRefreshTests(unittest.TestCase):
    place = {'id':'node/1', 'name':'Example Coffee', 'mapsUrl':'https://www.google.com/maps/search/Example+Coffee/?hl=id', 'latitude':-6.24, 'longitude':106.8}

    def capture(self, authors, **overrides):
        reviews = ''.join(f'<div data-review-id="r{author}" aria-label="Author {author}"><span role="img" aria-label="4 stars"></span><button data-href="https://www.google.com/maps/contrib/{author}/reviews?hl=en"></button><div class="MyEned"><span class="wiI7pd">Actual reviewer words {author}</span></div><div class="CDe7pd"><div class="wiI7pd">Owner response is not the review</div></div></div>' for author in authors)
        return {'id':'node/1', 'url':self.place['mapsUrl'].replace('hl=id','hl=en'), 'html':'<h1>Example Coffee</h1>'+reviews, 'checkedAt':'2026-10-25T00:00:00Z', **overrides}

    def test_merges_five_unique_sources_without_owner_replies(self):
        rows = merge_reviews([self.place], [self.capture([1,2,3]), self.capture([3,4,5])], [])
        self.assertEqual(len(rows[0]['reviews']), 5)
        self.assertEqual(len({r['authorUrl'] for r in rows[0]['reviews']}), 5)
        self.assertTrue(all(r['excerpt'].startswith('Actual reviewer words') for r in rows[0]['reviews']))

    def test_shortfalls_and_wrong_branches_do_not_modify_the_input(self):
        for capture in [self.capture([1,2,3]), self.capture([1,2,3,4,5],html='<h1>Wrong Business</h1>'), self.capture([1,2,3,4,5],url='https://www.google.com/maps/place/Example/data=!3d-6.4!4d106.8')]:
            with self.assertRaises(ValueError): merge_reviews([self.place], [capture], [])
            self.assertNotIn('reviews',self.place)

    def test_direct_branch_link_requires_matching_coordinates(self):
        rows = merge_reviews([self.place], [self.capture([1,2,3,4,5],url='https://www.google.com/maps/place/Example/data=!3d-6.24!4d106.8')], [])
        self.assertEqual(len(rows[0]['reviews']),5)


if __name__ == '__main__': unittest.main()
