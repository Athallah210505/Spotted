"""Resume ordinary headless collection, with exact-branch matching and a stop on blocking."""

import argparse
import asyncio
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote, urlsplit

from scrapling.parser import Selector
from build_food_database import ROOT, FOLDER, distance, normalize_name
from enrich_jaksel_candidates import inspect, name_evidence, address_evidence

BASELINE_IDS = {row["id"] for row in json.loads((ROOT / "src/features/catalog/data/google-places.json").read_text())}


def matching_name(expected, actual):
    a, b = normalize_name(expected), normalize_name(actual)
    return name_evidence(expected, actual) or (min(len(a), len(b)) >= 8 and (a.startswith(b) or b.startswith(a)))


def exact_address_match(expected, actual):
    source = re.search(r"\b(?:jalan|jl\.?)\s+(.+?)\s+(?:no\.?\s*)?(\d+[a-z]?)\s*(?:,|$)", expected or "", re.I)
    target = re.search(r"\bno\.?\s*(\d+[a-z]?)\b", actual or "", re.I)
    if not source or not target:
        return False
    street = re.sub(r"\s+no\.?$", "", source[1], flags=re.I)
    return source[2].casefold() == target[1].casefold() and normalize_name(street) in normalize_name(actual) and "jakarta" in actual.casefold()


def selected_marker(raw, known_cid=None):
    markers = {}
    for url in raw.get('mapMarkerUrls', []):
        parsed = urlsplit(url)
        if parsed.scheme != 'https' or parsed.hostname != 'www.google.com' or not parsed.path.startswith('/maps/vt/') or 'spotlit' not in url:
            continue
        identity = re.search(r'!1m2!1y(\d+)!2y(\d+)!2s[^!]+!4m2!1x(\d+)!2x(\d+)!15s', url)
        if not identity:
            continue
        _, number, x, y = map(int, identity.groups())
        cid = format(number, 'x')
        if known_cid and cid != known_cid:
            continue
        lat = (x - (2**32 if x >= 2**31 else 0)) / 10**7
        lon = (y - (2**32 if y >= 2**31 else 0)) / 10**7
        if -6.45 <= lat <= -6.10 and 106.68 <= lon <= 106.95:
            markers[cid] = {'latitude': lat, 'longitude': lon, 'cid': cid, 'coordinateEvidenceUrl': url}
    return next(iter(markers.values())) if len(markers) == 1 else None


def blocked(raw):
    if raw.get("httpStatus") in {403, 429} or "/sorry/" in raw["url"]:
        return True
    phrases = ('our systems have detected unusual traffic', 'unusual traffic from your computer',
               'sistem kami mendeteksi lalu lintas', 'before you continue to google', 'sebelum melanjutkan ke google')
    html = raw.get('html', '').casefold()
    if not any(phrase in html for phrase in phrases):
        return False
    page = Selector(raw['html'])
    visible = ' '.join(page.xpath('//body//text()[not(ancestor::script) and not(ancestor::style)]').getall()).casefold()
    return any(phrase in visible for phrase in phrases)


def result_link(raw, place):
    candidates = {}
    for link in Selector(raw["html"]).css("a.hfpxzc[href]"):
        url = link.attrib["href"]
        coords = re.search(r"!3d(-?[\d.]+)!4d(-?[\d.]+)", url)
        name = link.attrib.get("aria-label", "")
        parsed = urlsplit(url)
        if parsed.scheme != "https" or parsed.hostname != "www.google.com" or not parsed.path.startswith("/maps/place/") or not coords or not matching_name(place["name"], name):
            continue
        point = tuple(map(float, coords.groups()))
        if distance(point, (place["latitude"], place["longitude"])) <= 100:
            identity = re.search(r"0x[0-9a-f]+:0x[0-9a-f]+", url)
            candidates[identity.group() if identity else url] = url
    return next(iter(candidates.values())) if len(candidates) == 1 else None


def nearby_candidates(raw, place):
    result = []
    for link in Selector(raw.get("html", "")).css("a.hfpxzc[href]"):
        url = link.attrib["href"]
        coords = re.search(r"!3d(-?[\d.]+)!4d(-?[\d.]+)", url)
        parsed = urlsplit(url)
        if coords and parsed.scheme == "https" and parsed.hostname == "www.google.com" and parsed.path.startswith("/maps/place/"):
            meters = distance(tuple(map(float, coords.groups())), (place["latitude"], place["longitude"]))
            if meters <= 100:
                result.append({"name": link.attrib.get("aria-label"), "sourceUrl": url, "distanceM": round(meters, 1)})
    return result[:5]


def match(raw, place):
    if blocked(raw):
        return {"status": "blocked"}
    if raw.get("error"):
        return {"status": "fetch_error"}
    item = inspect(raw)
    if item["status"] not in {"captured", "closed", "missing_coordinates"}:
        return {"status": item["status"]}
    if not matching_name(place["name"], item["name"]):
        return {"status": "name_mismatch"}
    if item.get('category') == 'Tempat makan':
        item['category'] = None
    if item.get('category') and not re.search(r'restoran|restaurant|caf[eé]|kafe|kedai|warung|rumah makan|toko (?:roti|kue|donat|cok[e]?lat|permen|makanan|kopi|teh|es)|bakery|boulangerie|pastry|ice.?cream|dessert|food|\btea\b|coffee|kios|hamburger|pizza|pujasera|jajanan|kuliner|katering|catering', item['category'], re.I):
        return {'status': 'non_food_category_needs_review'}
    if item.get('latitude') is None:
        evidence = selected_marker(raw, item.get('cid'))
        if evidence:
            item.update(evidence)
    has_point = item.get("latitude") is not None
    if not has_point and not exact_address_match(place.get("address"), item.get("address")):
        return {"status": "missing_coordinates"}
    meters = distance((place["latitude"], place["longitude"]), (item["latitude"], item["longitude"])) if has_point else None
    if meters is not None and meters > 100:
        return {"status": "outside_match_radius", "distanceM": round(meters)}
    original_number = re.search(r"\b(?:no\.?|nomor)\s*(\d+[a-z]?)", place.get("address") or "", re.I)
    google_number = re.search(r"\b(?:no\.?|nomor)\s*(\d+[a-z]?)", item["address"], re.I)
    if original_number and google_number:
        a, b = original_number[1].casefold(), google_number[1].casefold()
        if re.match(r'\d+', a)[0] != re.match(r'\d+', b)[0] or (a[-1].isalpha() and b[-1].isalpha() and a[-1] != b[-1]):
            return {"status": "address_conflict"}
    return {"status": "matched", "google": item, "distanceM": round(meters, 1) if meters is not None else None}


def combine(place, captures):
    matches = [match(raw, place) for raw in captures]
    valid = [m for m in matches if m["status"] == "matched"]
    if not valid:
        return {"id": place["id"], "status": matches[-1]["status"] if matches else "not_fetched"}, None
    baseline = valid[0]
    g = baseline["google"]
    reviews = {}
    accepted = [g]
    for other in valid:
        row = other["google"]
        if row is g:
            continue
        if g.get("cid") and row.get("cid") and g["cid"] != row["cid"]:
            continue
        if g["latitude"] is not None and row["latitude"] is not None:
            if distance((g["latitude"], g["longitude"]), (row["latitude"], row["longitude"])) > 25:
                continue
        elif not exact_address_match(g["address"], row["address"]):
            continue
        same_cid = bool(g.get("cid") and g["cid"] == row.get("cid"))
        same_address = bool(g.get('address') and row.get('address') and address_evidence(g['address'], row['address']))
        if not same_cid and not same_address:
            continue
        accepted.append(row)
        if g["latitude"] is None and row["latitude"] is not None:
            g.update(latitude=row["latitude"], longitude=row["longitude"])
            g['coordinateEvidenceUrl'] = row.get('coordinateEvidenceUrl')
        g["cid"] = g.get("cid") or row.get("cid")
        g["closedReason"] = g.get("closedReason") or row.get("closedReason")
        for review in row["reviews"]:
            reviews[urlsplit(review["authorUrl"]).path] = review
        for field in ("photoUrl", "rating", "reviewCount", "hours"):
            if not g.get(field) and row.get(field):
                g[field] = row[field]
    # A single verified capture is usable even when its address lacks a street prefix.
    for review in g["reviews"]:
        reviews.setdefault(urlsplit(review["authorUrl"]).path, review)
    selected = list(reviews.values())[:5]
    full = bool(g["rating"] and g["reviewCount"] and g["photoUrl"] and len(selected) == 5)
    status = "closed" if g.get("closedReason") else "matched_with_five_reviews" if full else "matched_partial"
    row = {"id": place["id"], "name": g["name"], "category": g["category"],
           "latitude": g["latitude"] if g["latitude"] is not None else place["latitude"], "longitude": g["longitude"] if g["longitude"] is not None else place["longitude"], "address": g["address"],
           "googleLatitude": g["latitude"], "googleLongitude": g["longitude"],
           "rating": g["rating"], "reviewCount": g["reviewCount"], "photoUrl": g["photoUrl"],
           "hours": g["hours"], "reviews": selected, "mapsUrl": g["url"], "checkedAt": max(r["checkedAt"] for r in accepted),
           "matchDistanceM": baseline["distanceM"], "googleCid": g.get("cid"), "closedReason": g.get("closedReason"),
           "photoStatus": "source_reference_not_visually_reviewed", "enrichmentStatus": status,
           "matchMethod": "name-and-coordinates-within-100m" if baseline["distanceM"] is not None else "name-and-exact-street-number", "sourceRecordName": place["name"],
           "coordinateEvidenceUrl": g.get('coordinateEvidenceUrl'),
           "coordinateEvidenceType": "observed-selected-marker-request" if g.get('coordinateEvidenceUrl') else "listing-url-or-preload" if g['latitude'] is not None else "existing-osm-point",
           "captureUrls": list(dict.fromkeys(r["url"] for r in accepted))}
    return {"id": place["id"], "status": status, "reviews": len(selected), "checkedAt": row["checkedAt"]}, row


def write_json(path, value):
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    temp.replace(path)


def report(places, folder, output):
    results, verified = [], []
    files_by_prefix = defaultdict(list)
    for path in folder.glob('*.json'):
        files_by_prefix[path.stem.rsplit('-', 1)[0]].append(path)
    for place in places:
        if place["id"] in BASELINE_IDS:
            results.append({"id": place["id"], "status": "previously_verified"})
            continue
        if not place["name"]:
            files = sorted(files_by_prefix[place["id"].replace("/", "-")])
            candidates = nearby_candidates(json.loads(files[0].read_text()), place) if files else []
            results.append({"id": place["id"], "status": "needs_identity_evidence", "searched": bool(files), "nearbyCandidates": candidates})
            continue
        files = sorted(files_by_prefix[place["id"].replace("/", "-")])
        captures = [json.loads(p.read_text()) for p in files]
        audit, row = combine(place, captures)
        audit["captureCount"] = len(captures)
        audit["limitedPublicView"] = any(re.search(r"Anda melihat tampilan terbatas|limited view of Google Maps", r.get("html", ""), re.I) for r in captures)
        audit["lastAttemptAt"] = max((r["checkedAt"] for r in captures), default=None)
        audit["sourceUrls"] = list(dict.fromkeys(
            f"https://{urlsplit(r['url']).hostname}{urlsplit(r['url']).path}" if blocked(r) else r['url']
            for r in captures
        ))
        results.append(audit)
        if row:
            verified.append(row)
    provider_blocked = any(r['status'] == 'blocked' for r in results)
    if provider_blocked:
        for result in results:
            if result['status'] == 'not_fetched':
                result['status'] = 'not_attempted_provider_blocked'
    value = {"metadata": {"checkedAt": datetime.now(timezone.utc).isoformat(), "total": len(places),
                           "statuses": dict(Counter(r["status"] for r in results)), "newMatched": len(verified),
                           "providerBlocked": provider_blocked,
                           "recordsWithCaptures": sum(bool(r.get('captureCount') or r.get('searched')) for r in results)},
             "places": verified, "audit": results}
    write_json(output, value)
    print(json.dumps(value["metadata"]), flush=True)


async def collect(places, folder, executable, limit):
    from playwright.async_api import async_playwright
    stop_file = folder / 'provider-blocked.json'
    if stop_file.exists():
        print(json.dumps({'blocked': True, 'reason': 'saved_provider_block; no network requests issued'}), flush=True)
        return
    stopped = asyncio.Event()
    queue = asyncio.Queue()
    for row in places:
        if row["id"] not in BASELINE_IDS:
            queue.put_nowait(row)
    processed = 0
    async with async_playwright() as p:
        options = {"headless": True}
        if executable:
            options["executable_path"] = executable
        browser = await p.chromium.launch(**options)
        context = await browser.new_context(locale="id-ID", timezone_id="Asia/Jakarta")
        async def worker():
            nonlocal processed
            page = await context.new_page()
            await page.route("**/*", lambda route: route.abort() if route.request.resource_type in {"image", "font", "media"} or '/maps/vt/' in route.request.url else route.continue_())
            async def retrieve(url, file):
                if file.exists():
                    cached = json.loads(file.read_text())
                    if blocked(cached):
                        stopped.set()
                        write_json(stop_file, {'checkedAt': cached['checkedAt'], 'httpStatus': cached.get('httpStatus'), 'provider': 'Google Maps'})
                    return cached
                raw = {"url": url, "checkedAt": datetime.now(timezone.utc).isoformat()}
                try:
                    response = await page.goto(url, wait_until="domcontentloaded", timeout=25000)
                    try:
                        await page.wait_for_selector("h1", state="attached", timeout=2500)
                    except Exception:
                        raw["headingWaitExpired"] = True
                    await page.wait_for_timeout(500)
                    raw.update(url=page.url, html=await page.content(), httpStatus=response.status if response else None)
                    raw['mapMarkerUrls'] = await page.evaluate("() => performance.getEntriesByType('resource').map(e => e.name).filter(u => u.startsWith('https://www.google.com/maps/vt/') && u.includes('spotlit'))")
                except Exception as error:
                    raw.update(html=await page.content(), error=type(error).__name__)
                if blocked(raw):
                    stopped.set()
                    write_json(stop_file, {'checkedAt': raw['checkedAt'], 'httpStatus': raw.get('httpStatus'), 'provider': 'Google Maps'})
                write_json(file, raw)
                return raw
            while not queue.empty() and not stopped.is_set() and (limit is None or processed < limit):
                row = queue.get_nowait()
                prefix = folder / row["id"].replace("/", "-")
                query = " ".join(filter(None, [row['name'], row.get('address') or row['district'], row['city']])) if row['name'] else f"restaurants near {row['latitude']},{row['longitude']}"
                url = "https://www.google.com/maps/search/" + quote(query) + "?hl=id"
                first = await retrieve(url, Path(str(prefix) + "-id.json"))
                if not stopped.is_set() and row['name']:
                    parsed = match(first, row)
                    follow = result_link(first, row) if parsed["status"] == "unresolved_search" else None
                    limited = bool(re.search(r"Anda melihat tampilan terbatas|limited view of Google Maps", first.get("html", ""), re.I))
                    if follow or (not limited and parsed["status"] in {"matched", "missing_coordinates", "unresolved_search", "fetch_error"}):
                        target = follow or url.replace("hl=id", "hl=en")
                        await retrieve(target, Path(str(prefix) + "-follow.json"))
                processed += 1
                if processed % 20 == 0:
                    print(json.dumps({"processed": processed, "remaining": queue.qsize(), "blocked": stopped.is_set()}), flush=True)
            await page.close()
        try:
            await asyncio.gather(*(worker() for _ in range(5)))
        finally:
            await browser.close()
    print(json.dumps({"processed": processed, "remaining": queue.qsize(), "blocked": stopped.is_set()}), flush=True)


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--captures", type=Path, required=True)
    cli.add_argument("--collect", action="store_true")
    cli.add_argument("--executable")
    cli.add_argument("--limit", type=int, help="Smoke test only; omit to process the full named queue")
    cli.add_argument("--output", type=Path, default=FOLDER / "google-enrichment.json")
    args = cli.parse_args()
    args.captures.mkdir(parents=True, exist_ok=True)
    places = json.loads((FOLDER / "places.json").read_text())["places"]
    try:
        if args.collect:
            asyncio.run(collect(places, args.captures, args.executable, args.limit))
    finally:
        report(places, args.captures, args.output)
