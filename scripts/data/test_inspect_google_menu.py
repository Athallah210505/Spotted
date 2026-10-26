import unittest
from inspect_google_menu import parse_menu_photos


class GoogleMenuTests(unittest.TestCase):
    place = {'name':'Example Coffee','latitude':-6.24,'longitude':106.8}
    def raw(self):
        return {'url':'https://www.google.com/maps/place/Example/data=!3d-6.24!4d106.8','checkedAt':'2026-10-26T00:00:00Z','html':'''<h1>Example Coffee</h1><div data-review-id="one" aria-label="Reviewer"><button data-href="https://www.google.com/maps/contrib/123/reviews"></button><button data-photo-index="0" data-tooltip="Latte" style='background-image:url("https://lh3.googleusercontent.com/grass-cs/dish=w600-h450")'></button><button data-photo-index="1" data-tooltip="Interior" style='background-image:url("https://lh3.googleusercontent.com/grass-cs/room")'></button></div>'''}
    def test_only_selected_dishes_retain_their_real_author_and_photo(self):
        rows=parse_menu_photos(self.raw(),self.place,{'Latte'})
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['name'],'Latte')
        self.assertEqual(rows[0]['author'],'Reviewer')
        self.assertIn('/maps/contrib/123/',rows[0]['authorUrl'])
    def test_rejects_wrong_branch_unselected_captions_and_avatars(self):
        raw=self.raw()
        self.assertEqual(parse_menu_photos(raw,self.place,{'Unknown dish'}),[])
        self.assertEqual(parse_menu_photos(raw,{**self.place,'latitude':-6.3},{'Latte'}),[])
        for old,new in [('Example Coffee','Other Brand'),('https://lh3.googleusercontent.com/grass-cs/dish','https://evil.example/dish'),('/grass-cs/dish','/a-/avatar')]:
            changed={**raw,'html':raw['html'].replace(old,new)}
            self.assertEqual(parse_menu_photos(changed,self.place,{'Latte'}),[])


if __name__=='__main__': unittest.main()
