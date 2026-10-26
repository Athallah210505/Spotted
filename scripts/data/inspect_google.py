"""Normalize manually retrieved public Maps pages; never publish an unmatched branch."""
import json
import math
import re
from pathlib import Path
from urllib.parse import urlsplit
from scrapling.parser import Selector

ROOT = Path(__file__).resolve().parents[2]

def text(nodes):
    return nodes[0].get_all_text(separator=" ", strip=True) if nodes else ""

def distance(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    return 6371000 * 2 * math.asin(math.sqrt(math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2))

def maps_url(value):
    try:
        url=urlsplit(value)
        return url.scheme=="https" and url.hostname=="www.google.com" and url.path.startswith("/maps/") and not url.username and not url.password and not url.port
    except ValueError: return False

def same_name(original, actual):
    original=original.casefold().replace("gulai tikungan","gultik")
    actual=actual.casefold()
    compact=lambda s: re.sub(r"[\W_]", "", s)
    if not compact(original) or not compact(actual): return False
    if compact(original) in compact(actual) or compact(actual) in compact(original): return True
    common={"cafe","coffee","kopi","khas","by","the","restoran","restaurant","blok","m","co","sate","padang"}
    return bool((set(re.findall(r"\w+",original))-common)&(set(re.findall(r"\w+",actual))-common))

def parse_reviews(page):
    reviews = {}
    for node in page.css("div[data-review-id][aria-label]"):
        excerpt = text(node.xpath('.//*[contains(@class,"wiI7pd") and not(ancestor::*[contains(@class,"CDe7pd")])]')[:1])
        star = node.css('[role="img"][aria-label]')
        profile = node.css('button[data-href*="/maps/contrib/"]')
        match = next((m for item in star if (m := re.match(r"([1-5]) (?:bintang|stars?)", item.attrib.get("aria-label", "")))), None)
        if excerpt and match and profile and maps_url(profile[0].attrib["data-href"]):
            url = profile[0].attrib["data-href"]
            if not urlsplit(url).path.startswith('/maps/contrib/'): continue
            words = excerpt.split()
            reviews[urlsplit(url).path] = {"author":node.attrib["aria-label"], "authorUrl":url, "rating":int(match.group(1)), "excerpt":" ".join(words[:15])+("…" if len(words)>15 else "")}
    return list(reviews.values())[:5]

def parse_page(raw, place):
    page = Selector(raw["html"])
    if any(text([node]).casefold() in {"tutup permanen", "tutup sementara", "permanently closed", "temporarily closed"} for node in page.css('.fCEvvc')):
        return None
    name = text(page.css("h1"))
    if not maps_url(raw["url"]) or not name or name in {"Hasil", "Results"} or not same_name(place["name"],name):
        return None
    coordinates = re.search(r"!1x(\d+)!2x(\d+)", raw["html"])
    if coordinates:
        lat, lon = [(int(v) - (2**32 if int(v) >= 2**31 else 0))/10**7 for v in coordinates.groups()]
    else:
        direct = re.search(r"!3d(-?[\d.]+)!4d(-?[\d.]+)", raw["url"])
        if not direct: return None
        lat, lon = map(float, direct.groups())
    if not (-90<=lat<=90 and -180<=lon<=180): return None
    meters = distance((lat,lon), (place["latitude"], place["longitude"]))
    if meters > 400:
        return None
    scores = page.css('[role="img"][aria-label*="bintang"]')
    rating = next((float(m.group(1).replace(",", ".")) for n in scores if (m := re.match(r"^(\d(?:[.,]\d+)?) bintang", n.attrib.get("aria-label", "")))), None)
    count = re.search(r"\(([\d.,]+)\)", text(page.css(".F7nice")))
    images = [n for n in page.css('button[aria-label^="Foto"]:not([data-review-id]) > img[src*="googleusercontent.com"]') if not re.match(r"/a-?/",urlsplit(n.attrib['src']).path)]
    photo = images[0].attrib.get("src") if images else None
    reference=raw.get('photoReference',{})
    if not photo and reference.get('name')==name and reference.get('sourceUrl')==raw['url']:
        photo=reference.get('url')
    if rating is None or not 1 <= rating <= 5 or not count or not photo or urlsplit(photo).scheme!="https" or re.match(r"/a-?/",urlsplit(photo).path) or not re.fullmatch(r"lh[3-6]\.googleusercontent\.com", urlsplit(photo).hostname or ""):
        return None
    address = page.css('[data-item-id="address"]')
    hours = []
    for row in page.css("table.eK4R0e tr"):
        cells = row.css("td")
        if len(cells) >= 2:
            hours.append({"day":text(cells[:1]), "text":text(cells[1:2])})
    reviews = parse_reviews(page)
    return {"id":place["id"], "name":name, "category":text(page.css("button.DkEaL")) or "Tempat makan", "area":place["area"], "latitude":lat, "longitude":lon, "address":address[0].attrib.get("aria-label", "").removeprefix("Alamat: ").strip() if address else None, "rating":rating, "reviewCount":int(re.sub(r"[.,]", "", count.group(1))), "photoUrl":photo, "hours":hours, "reviews":reviews, "mapsUrl":raw["url"], "checkedAt":raw["checkedAt"], "matchDistanceM":round(meters)}

if __name__ == "__main__":
    import argparse
    cli=argparse.ArgumentParser(description=__doc__)
    cli.add_argument("input", type=Path)
    cli.add_argument("--download-photos", action="store_true")
    args=cli.parse_args()
    source=json.loads((ROOT/"src/features/catalog/data/jakarta-pilot.json").read_text())
    places={p["id"]:p for p in source["places"]}
    rows={}
    for raw in json.loads(args.input.read_text()):
        parsed=parse_page(raw,places[raw["id"]])
        if parsed: rows[parsed["id"]]=parsed
    output=ROOT/"src/features/catalog/data/google-places.json"
    if not rows: cli.exit(1,"No matched places; previous snapshot unchanged\n")
    if output.exists():
        previous={row['id']:row for row in json.loads(output.read_text())}
        for id,row in rows.items():
            old=previous.get(id,{})
            if old.get('photoUrl')==row['photoUrl'] and old.get('photoPath') and (ROOT/"public"/old['photoPath'].lstrip('/')).is_file(): row['photoPath']=old['photoPath']
            if old.get('reviewsCheckedAt') and old.get('name')==row['name'] and len(old.get('reviews',[]))>len(row['reviews']):
                row['reviews']=old['reviews']
                row['reviewsCheckedAt']=old['reviewsCheckedAt']
    if args.download_photos:
        from concurrent.futures import ThreadPoolExecutor
        from urllib.request import Request, urlopen
        folder=ROOT/"public/google-places"
        folder.mkdir(parents=True,exist_ok=True)
        def download(row):
            if row.get('photoPath'): return row
            url=re.sub(r'=w\d+-h\d+[^?]*$', '=w960-h720-k-no', row['photoUrl'])
            try:
                with urlopen(Request(url,headers={"User-Agent":"SPOTTEDDataReview/0.1"}),timeout=20) as response:
                    extension={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}.get(response.headers.get_content_type())
                    data=response.read(4_000_001)
                if not extension or len(data)>4_000_000: return None
                from hashlib import sha256
                name=row['id'].replace('/','-')+'-'+sha256(data).hexdigest()[:8]+'.'+extension
                (folder/name).write_bytes(data)
                return {**row,"photoPath":"/google-places/"+name}
            except (OSError,ValueError): return None
        with ThreadPoolExecutor(max_workers=3) as pool:
            rows={row['id']:row for row in pool.map(download,rows.values()) if row}
        if not rows: cli.exit(1,"No photos retrieved; previous snapshot unchanged\n")
    temporary=output.with_suffix(".tmp")
    temporary.write_text(json.dumps(list(rows.values()),ensure_ascii=False,indent=2)+"\n")
    temporary.replace(output)
    print(json.dumps({"matched":len(rows),"records":[{"id":p["id"],"name":p["name"],"rating":p["rating"],"distance":p["matchDistanceM"]} for p in rows.values()]},ensure_ascii=False))
