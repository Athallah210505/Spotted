import unittest
from inspect_google import parse_page, same_name

class GoogleInspectionTests(unittest.TestCase):
    def raw(self, **values):
        return {"url":"https://www.google.com/maps/place/Example+Coffee/data=!3d-6.244!4d106.8", "checkedAt":"2026-10-25T00:00:00Z", "html":'''<h1>Example Coffee</h1><span role="img" aria-label="4,8 bintang"></span><div class="F7nice">4,8 (2.450)</div><button aria-label="Foto Example"><img src="https://lh3.googleusercontent.com/example=w408-h306-k-no"></button><button class="DkEaL">Kedai Kopi</button><button data-item-id="address" aria-label="Alamat: Jalan Example 1"></button><table class="eK4R0e"><tr><td>Senin</td><td>07.00–21.00</td></tr></table><div data-review-id="sample" aria-label="Test Author"><span class="wiI7pd">One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen</span><span role="img" aria-label="4 bintang"></span><button data-href="https://www.google.com/maps/contrib/123/reviews"></button></div>''', **values}
    def place(self): return {"id":"node/1","name":"Example Coffee","area":"blok-m","latitude":-6.244,"longitude":106.8}
    def test_factual_fields_keep_author_score_and_short_excerpt(self):
        result=parse_page(self.raw(),self.place())
        self.assertEqual(result['rating'],4.8)
        self.assertEqual(result['reviewCount'],2450)
        self.assertEqual(result['hours'],[{"day":"Senin","text":"07.00–21.00"}])
        self.assertEqual(result['reviews'][0]['rating'],4)
        self.assertEqual(len(result['reviews'][0]['excerpt'].split()),15)
        self.assertEqual(result['reviews'][0]['author'],'Test Author')
    def test_missing_or_wrong_branch_does_not_create_data(self):
        for raw in [self.raw(url="https://evil.example/maps/place/x"),self.raw(url="https://www.google.com/maps/place/x/data=!3d-6.3!4d106.8"),self.raw(html=self.raw()['html'].replace('Example Coffee</h1>','Other Brand</h1>')),self.raw(html='<h1>Hasil</h1>')]:
            self.assertIsNone(parse_page(raw,self.place()))
    def test_unsafe_photos_and_unknown_ratings_are_rejected(self):
        for html in [self.raw()['html'].replace('lh3.googleusercontent.com','evil.example'),self.raw()['html'].replace('4,8 bintang','9,9 bintang'),'<h1>Example Coffee</h1>']:
            self.assertIsNone(parse_page(self.raw(html=html),self.place()))
    def test_aliases_preserve_real_name_without_matching_unrelated_business(self):
        self.assertTrue(same_name('Gulai Tikungan Blok M','Gultik Blok M Plaza Pak Agus Budi'))
        self.assertTrue(same_name('J.Co','J.CO Donuts & Coffee'))
        self.assertFalse(same_name('Example Coffee','Different Coffee'))
    def test_avatar_is_never_used_as_a_venue_photo(self):
        raw=self.raw(html=self.raw()['html'].replace('https://lh3.googleusercontent.com/example=w408-h306-k-no','https://lh3.googleusercontent.com/a-/avatar=w72-h72'))
        self.assertIsNone(parse_page(raw,self.place()))
        raw['photoReference']={'name':'Example Coffee','sourceUrl':raw['url'],'url':'https://lh3.googleusercontent.com/grass-cs/venue=w408-h306'}
        self.assertIsNotNone(parse_page(raw,self.place()))
        raw['photoReference']['name']='Wrong venue'
        self.assertIsNone(parse_page(raw,self.place()))

if __name__=='__main__': unittest.main()
