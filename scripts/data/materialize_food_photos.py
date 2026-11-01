"""Download only verified listing photos and attributed menu photos from saved Google evidence."""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, build_opener
from urllib.error import URLError

from build_food_database import ROOT, FOLDER
from import_catalog import NoRedirect


def allowed_photo(value):
    try:
        url = urlsplit(value)
        return url.scheme == 'https' and bool(re.fullmatch(r'lh[3-6]\.googleusercontent\.com', url.hostname or '')) and not url.username and not url.password and not url.port and not re.match(r'/a-?/', url.path)
    except ValueError:
        return False


def extension(data, content_type):
    if len(data) > 4_000_000:
        raise ValueError('Photo exceeds size limit')
    if content_type == 'image/jpeg' and data.startswith(b'\xff\xd8\xff'): return 'jpg'
    if content_type == 'image/png' and data.startswith(b'\x89PNG\r\n\x1a\n'): return 'png'
    if content_type == 'image/webp' and data.startswith(b'RIFF') and data[8:12] == b'WEBP': return 'webp'
    raise ValueError('Unsupported or invalid image')


def download(url, identifier, folder):
    if not allowed_photo(url): raise ValueError('Untrusted photo URL')
    with build_opener(NoRedirect).open(Request(url, headers={'User-Agent':'SPOTTEDDataReview/0.1'}), timeout=20) as response:
        data = response.read(4_000_001)
        suffix = extension(data, response.headers.get_content_type())
    digest = hashlib.sha256(data).hexdigest()
    name = identifier.replace('/','-') + '-' + digest[:8] + '.' + suffix
    destination = folder / name
    if not destination.exists():
        temp = destination.with_suffix('.tmp'); temp.write_bytes(data); temp.replace(destination)
    return {'photoPath':'/google-places/'+name,'sha256':digest,'downloadedAt':datetime.now(timezone.utc).isoformat(),'sourcePhotoUrl':url}


def materialize(file, folder):
    payload = json.loads(file.read_text())
    downloaded, failures = 0, []
    for row in payload['places']:
        if not row.get('photoUrl'): continue
        try:
            if not row.get('photoPath') or not (ROOT/'public'/row['photoPath'].lstrip('/')).is_file():
                media = download(row['photoUrl'],row['id'],folder)
                row.update(photoPath=media['photoPath'], photoEvidence=media, photoStatus='downloaded_listing_photo')
                downloaded += 1
            menus = {item['photoUrl']:item for item in row.get('menuPhotos', [])}
            for photo in row.get('reviewPhotos', []):
                if len(menus) >= 2: break
                if photo['url'] in menus or not re.search(r'\bmenu\b|daftar harga',photo.get('caption',''),re.I): continue
                author = urlsplit(photo.get('authorUrl',''))
                if author.scheme != 'https' or author.hostname != 'www.google.com' or not author.path.startswith('/maps/contrib/'): continue
                media = download(photo['url'],row['id']+'-menu',folder)
                menus[photo['url']] = {'name':photo['caption'][:100],'photoPath':media['photoPath'],'photoUrl':photo['url'],
                                      'author':photo['author'],'authorUrl':photo['authorUrl'],'mediaEvidence':media}
                downloaded += 1
            if menus: row['menuPhotos'] = list(menus.values())
        except (OSError,ValueError,URLError) as error:
            failures.append({'id':row['id'],'error':type(error).__name__})
    temp=file.with_suffix('.tmp');temp.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n');temp.replace(file)
    print(json.dumps({'file':file.name,'downloaded':downloaded,'failures':failures}),flush=True)


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--input',type=Path,action='append',required=True)
    args = cli.parse_args()
    folder = ROOT/'public/google-places';folder.mkdir(parents=True,exist_ok=True)
    for file in args.input: materialize(file,folder)
