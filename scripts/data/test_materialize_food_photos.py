import unittest
from materialize_food_photos import allowed_photo, extension

class PhotoTests(unittest.TestCase):
    def test_only_google_listing_images_are_allowed(self):
        self.assertTrue(allowed_photo('https://lh3.googleusercontent.com/grass-cs/example=w408-h306'))
        for url in ['https://lh3.googleusercontent.com/a-/avatar','https://evil.example/photo','https://lh3.googleusercontent.com:444/photo','https://name:password@lh3.googleusercontent.com/photo','http://lh3.googleusercontent.com/photo']:
            self.assertFalse(allowed_photo(url))
    def test_image_bytes_and_type_must_agree(self):
        self.assertEqual(extension(b'\xff\xd8\xff\x00','image/jpeg'),'jpg')
        with self.assertRaises(ValueError):extension(b'<html>','image/jpeg')
        with self.assertRaises(ValueError):extension(b'\xff\xd8\xff','image/png')

if __name__=='__main__':unittest.main()
