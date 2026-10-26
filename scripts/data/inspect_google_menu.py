"""Read explicitly selected dish-photo captions from verified public Google reviews."""
import re
from urllib.parse import urlsplit
from scrapling.parser import Selector
from inspect_google import distance, maps_url, same_name, text


def parse_menu_photos(raw, place, captions):
    if not maps_url(raw['url']): return []
    page = Selector(raw['html'])
    if not same_name(place['name'], text(page.css('h1'))): return []
    coords = re.search(r'!1x(\d+)!2x(\d+)', raw['html'])
    if coords:
        point = tuple((int(v)-(2**32 if int(v)>=2**31 else 0))/10**7 for v in coords.groups())
    else:
        coords = re.search(r'!3d(-?[\d.]+)!4d(-?[\d.]+)',raw['url'])
        if not coords: return []
        point = tuple(map(float,coords.groups()))
    if distance(point,(place['latitude'],place['longitude']))>25: return []
    found = {}
    for review in page.css('div[data-review-id][aria-label]'):
        profile = review.css('button[data-href*="/maps/contrib/"]')
        if not profile: continue
        author_url = profile[0].attrib['data-href']
        if not maps_url(author_url) or not urlsplit(author_url).path.startswith('/maps/contrib/'): continue
        for button in review.css('button[data-photo-index][data-tooltip]'):
            caption = button.attrib.get('data-tooltip','').strip()
            if caption not in captions: continue
            match = re.search(r'url\([\"\']?([^\"\')]+)',button.attrib.get('style',''))
            if not match: continue
            url = match.group(1)
            image = urlsplit(url)
            if image.scheme!='https' or not re.fullmatch(r'lh[3-6]\.googleusercontent\.com',image.hostname or '') or re.match(r'/a-?/',image.path): continue
            found[caption] = {'name':caption,'photoUrl':url,'author':review.attrib['aria-label'],'authorUrl':author_url,'sourceUrl':raw['url'],'checkedAt':raw['checkedAt']}
    return list(found.values())[:4]
