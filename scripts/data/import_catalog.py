"""Import a small public OSM snapshot and inspect one explicitly selected website."""

import argparse
import ipaddress
import json
import math
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode, urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from urllib.robotparser import RobotFileParser

from scrapling.parser import Selector

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "src/features/catalog/data/jakarta-pilot.json"
AGENT = "SPOTTEDDataPilot/0.1 (+https://github.com/Athallah210505/Spotted)"
AREAS = [
    ("blok-m", "Blok M", [106.795, -6.249, 106.805, -6.239]),
    ("menteng", "Menteng", [106.827, -6.199, 106.837, -6.189]),
    ("kelapa-gading", "Kelapa Gading", [106.900, -6.163, 106.910, -6.153]),
    ("kota-tua", "Kota Tua", [106.808, -6.140, 106.818, -6.130]),
]
KINDS = {"restaurant", "cafe", "fast_food", "food_court"}
WEBSITE = "https://cafebatavia.com/"
WEBSITE_PLACE = "node/4245907143"


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch(url, limit=12_000_000):
    # Do not follow a public website's redirects to an unreviewed host.
    with build_opener(NoRedirect).open(Request(url, headers={"User-Agent": AGENT}), timeout=20) as response:
        body = response.read(limit + 1)
        if len(body) > limit:
            raise ValueError("Response exceeds pilot size limit")
        return body.decode("utf-8"), response.status


def public_url(value):
    if not isinstance(value, str) or len(value) > 2048:
        return None
    try:
        url = urlsplit(value.strip())
        if url.scheme not in {"https", "http"} or not url.hostname or url.username or url.password or url.port:
            return None
        host = url.hostname.lower()
        try:
            if not ipaddress.ip_address(host).is_global:
                return None
        except ValueError:
            if "." not in host or host.endswith((".local", ".internal", ".localhost")):
                return None
        return url.geturl()
    except ValueError:
        return None


def text(value):
    return value.strip()[:300] if isinstance(value, str) and value.strip() else None


def normalize(elements, area, fetched_at):
    slug, _, (west, south, east, north) = area
    rows = {}
    for element in elements:
        if not isinstance(element, dict):
            continue
        tags = element.get("tags", {})
        if not isinstance(tags, dict):
            continue
        lat, lon = element.get("lat"), element.get("lon")
        if element.get("type") != "node" or type(element.get("id")) is not int or element["id"] <= 0:
            continue
        if not all(type(v) in (int, float) and math.isfinite(v) for v in (lat, lon)):
            continue
        if not (south <= lat <= north and west <= lon <= east):
            continue
        if tags.get("amenity") not in KINDS or not text(tags.get("name")):
            continue
        address = text(tags.get("addr:full"))
        if not address:
            street = " ".join(v for v in [text(tags.get("addr:street")), text(tags.get("addr:housenumber"))] if v)
            address = ", ".join(v for v in [street, text(tags.get("addr:suburb")), text(tags.get("addr:city")), text(tags.get("addr:postcode"))] if v) or None
        osm_id = f"node/{element['id']}"
        rows[osm_id] = {
            "id": osm_id,
            "name": text(tags["name"]),
            "area": slug,
            "kind": tags["amenity"],
            "latitude": lat,
            "longitude": lon,
            "address": address,
            "cuisine": text(tags.get("cuisine")),
            "openingHours": text(tags.get("opening_hours")),
            "website": public_url(tags.get("website") or tags.get("contact:website")),
            "sourceUrl": f"https://www.openstreetmap.org/{osm_id}",
            "osmEditedAt": text(element.get("timestamp")),
            "fetchedAt": fetched_at,
            "websiteInspection": None,
        }
    return list(rows.values())


def parse_website(html):
    page = Selector(html)
    title = " ".join(page.css("title::text").getall()).strip()[:160] or None
    menus = [urljoin(WEBSITE, href) for href in page.css("a::attr(href)").getall() if "menu" in href.lower()]
    menu = next((url for url in menus if public_url(url) and urlsplit(url).hostname == "cafebatavia.com"), None)
    return {"pageTitle": title, "menuUrl": menu}


def inspect_website():
    result = {"sourceUrl": WEBSITE, "checkedAt": datetime.now(timezone.utc).isoformat(), "status": "unavailable", "httpStatus": None, "robotsStatus": None, "pageTitle": None, "menuUrl": None}
    try:
        robots_url = urljoin(WEBSITE, "/robots.txt")
        try:
            rules, status = fetch(robots_url, 100_000)
            result["robotsStatus"] = status
            robot = RobotFileParser(robots_url)
            robot.parse(rules.splitlines())
            if not robot.can_fetch(AGENT, WEBSITE):
                result["status"] = "robots_disallowed"
                return result
        except HTTPError as error:
            result["robotsStatus"] = error.code
            if error.code != 404:
                return result
        html, status = fetch(WEBSITE, 2_000_000)
        result.update(parse_website(html), status="fetched", httpStatus=status)
    except HTTPError as error:
        result["httpStatus"] = error.code
    except (OSError, ValueError):
        pass
    return result


def build_snapshot(raw_by_area, fetched_at, website_inspection=None):
    places, area_info, seen = [], [], set()
    for area in AREAS:
        slug, label, bounds = area
        rows = normalize(raw_by_area[slug]["elements"], area, raw_by_area[slug].get("retrievedAt", fetched_at))
        rows.sort(key=lambda row: (-sum(bool(row[key]) for key in ["address", "cuisine", "openingHours", "website"]), row["id"]))
        selected = [row for row in rows if row["id"] not in seen][:10]
        if not selected:
            raise ValueError(f"No named food points returned for {slug}; previous snapshot kept")
        for row in selected:
            seen.add(row["id"])
            if row["id"] == WEBSITE_PLACE:
                row["websiteInspection"] = website_inspection
        places.extend(selected)
        area_info.append({"id": slug, "name": label, "bounds": bounds, "eligiblePointCount": len(rows), "selectedCount": len(selected)})
    return {"schemaVersion": 1, "fetchedAt": fetched_at, "source": "OpenStreetMap", "license": "ODbL-1.0", "attribution": "© OpenStreetMap contributors", "licenseUrl": "https://www.openstreetmap.org/copyright", "selection": "Up to 10 named food nodes per sample area, prioritizing populated address, cuisine, hours and website tags, then OSM ID. Polygon-only places excluded. Not a complete Jakarta catalogue.", "areas": area_info, "places": places}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", type=Path, help="Use already downloaded OSM map JSON files named after each area")
    parser.add_argument("--enrich", action="store_true", help="Inspect only the reviewed Cafe Batavia website; never auto-crawl OSM URLs")
    args = parser.parse_args()
    try:
        fetched_at = datetime.now(timezone.utc).isoformat()
        raw = {}
        for slug, _, bounds in AREAS:
            if args.input_dir:
                source = args.input_dir / f"{slug}.json"
                raw[slug] = json.loads(source.read_text())
                raw[slug]["retrievedAt"] = datetime.fromtimestamp(source.stat().st_mtime, timezone.utc).isoformat()
            else:
                url = "https://api.openstreetmap.org/api/0.6/map.json?" + urlencode({"bbox": ",".join(map(str, bounds))})
                raw[slug] = json.loads(fetch(url)[0])
                raw[slug]["retrievedAt"] = datetime.now(timezone.utc).isoformat()
        fetched_at = max(data["retrievedAt"] for data in raw.values())
        snapshot = build_snapshot(raw, fetched_at, inspect_website() if args.enrich else None)
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        temporary = OUTPUT.with_suffix(".json.tmp")
        temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
        temporary.replace(OUTPUT)
        print(f"Saved {len(snapshot['places'])} places across {len(snapshot['areas'])} sample areas to {OUTPUT.relative_to(ROOT)}")
    except (OSError, ValueError, KeyError) as error:
        parser.exit(1, f"Import failed; previous snapshot unchanged: {error}\n")


if __name__ == "__main__":
    main()
