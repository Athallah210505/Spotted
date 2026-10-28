"""Build a local research database; never replace the app's verified catalogue."""

import argparse
import csv
import hashlib
import json
import math
import re
import sqlite3
import tempfile
import unicodedata
from collections import Counter, defaultdict
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
FOLDER = ROOT / "research/jaksel-jakbar-2026-10-28"
CITIES = {5802438: "Jakarta Selatan", 7626001: "Jakarta Barat"}
AMENITIES = {"restaurant", "cafe", "fast_food", "food_court", "ice_cream"}
SHOPS = {"bakery", "deli", "confectionery", "pastry", "chocolate", "coffee", "tea"}


def dump(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def geometry(relation):
    edges = {"outer": [], "inner": []}
    ends = Counter()
    for member in relation["members"]:
        role = member.get("role") or "outer"
        if member["type"] != "way" or role not in edges:
            continue
        points = [(p["lon"], p["lat"]) for p in member.get("geometry", [])]
        if len(points) < 2:
            raise ValueError("Incomplete boundary geometry")
        ends[(role, points[0])] += 1
        ends[(role, points[-1])] += 1
        edges[role].extend(zip(points, points[1:]))
    if not edges["outer"] or any(count % 2 for count in ends.values()):
        raise ValueError("Boundary is not closed")
    return {"id": relation["id"], "name": relation["tags"]["name"], "edges": edges}


def contains(boundary, lat, lon):
    def inside(edges):
        result = False
        for (x1, y1), (x2, y2) in edges:
            cross = (lon - x1) * (y2 - y1) - (lat - y1) * (x2 - x1)
            if abs(cross) < 1e-12 and min(x1, x2) <= lon <= max(x1, x2) and min(y1, y2) <= lat <= max(y1, y2):
                return True
            if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
                result = not result
        return result
    return inside(boundary["edges"]["outer"]) and not inside(boundary["edges"]["inner"])


def eligible(tags):
    return tags.get("amenity") in AMENITIES or tags.get("shop") in SHOPS


def category(tags):
    return tags.get("amenity") if tags.get("amenity") in AMENITIES else tags.get("shop")


def google_category(value):
    value = value.casefold()
    if "kopi" in value or value in {"kafe", "cafe"}:
        return "cafe"
    if "roti" in value:
        return "bakery"
    if "teh" in value:
        return "tea"
    if "cepat saji" in value or "sandwich" in value or "hamburger" in value:
        return "fast_food"
    return "restaurant" if value.startswith("restoran") else "food_business"


def address(tags):
    if tags.get("addr:full"):
        return tags["addr:full"]
    street = " ".join(filter(None, [tags.get("addr:street"), tags.get("addr:housenumber")]))
    return ", ".join(filter(None, [street, tags.get("addr:suburb"), tags.get("addr:city"), tags.get("addr:postcode")])) or None


def normalize_name(name):
    value = unicodedata.normalize("NFKD", name or "").casefold()
    return re.sub(r"[^a-z0-9]", "", value)


def distance(a, b):
    lat = math.radians((a[0] + b[0]) / 2)
    return math.hypot(math.radians(a[0] - b[0]), math.radians(a[1] - b[1]) * math.cos(lat)) * 6_371_000


def checked_json(path):
    value = json.loads(path.read_bytes())
    if value.get("remark") or not isinstance(value.get("elements"), list):
        raise ValueError("Overpass returned incomplete data")
    return value


def fetch(query, destination):
    url = "https://overpass-api.de/api/interpreter?" + urlencode({"data": query.read_text()})
    with urlopen(Request(url, headers={"User-Agent": "SPOTTEDDataResearch/1.0"}), timeout=105) as response:
        raw = response.read(25_000_001)
    if len(raw) > 25_000_000:
        raise ValueError("Overpass response exceeds 25 MB")
    value = json.loads(raw)
    if value.get("remark") or not isinstance(value.get("elements"), list):
        raise ValueError("Overpass returned incomplete data; previous database kept")
    destination.write_bytes(raw)


def build(raw, districts_raw, google, research, checked_at):
    city_relations = [r for r in raw["elements"] if r.get("id") in CITIES and r["type"] == "relation"]
    if len(city_relations) != 2 or any(r["tags"]["name"] != CITIES[r["id"]] for r in city_relations):
        raise ValueError("Both expected city boundaries are required")
    cities = [geometry(r) for r in city_relations]
    districts = [geometry(r) for r in districts_raw["elements"] if r.get("tags", {}).get("admin_level") == "6"]
    if len(districts) != 18:
        raise ValueError("Expected all 18 kecamatan boundaries")
    foods = [r for r in raw["elements"] if eligible(r.get("tags", {}))]
    counts = [r for r in raw["elements"] if r["type"] == "count"]
    if len(counts) != 1 or int(counts[0]["tags"]["total"]) != len(foods):
        raise ValueError("Overpass count does not match the received food objects")
    places, sources, reviews, excluded = {}, [], [], []
    def locate(lat, lon):
        if not all(type(v) in (int, float) and math.isfinite(v) for v in (lat, lon)):
            return None, None
        matches = [b["name"] for b in cities if contains(b, lat, lon)]
        if len(matches) != 1:
            return None, None
        area = [b["name"] for b in districts if contains(b, lat, lon)]
        return matches[0], area[0] if len(area) == 1 else None
    for element in foods:
        tags = element["tags"]
        identifier = f"{element['type']}/{element['id']}"
        point = element if element["type"] == "node" else element.get("center", {})
        lat, lon = point.get("lat"), point.get("lon")
        city, district = locate(lat, lon)
        if not city:
            excluded.append({"id": identifier, "reason": "point_outside_or_ambiguous_city", "latitude": lat, "longitude": lon})
            continue
        name = (tags.get("name") or tags.get("name:id") or tags.get("name:en") or "").strip() or None
        places[identifier] = {
            "id": identifier, "name": name, "city": city, "district": district,
            "category": category(tags), "latitude": lat, "longitude": lon,
            "coordinate_method": "osm_node" if element["type"] == "node" else "osm_bbox_center",
            "address": address(tags), "cuisine": tags.get("cuisine"),
            "opening_hours": tags.get("opening_hours"), "google_rating": None,
            "google_review_count": None, "google_maps_url": None, "photo_url": None,
            "primary_source_url": f"https://www.openstreetmap.org/{identifier}",
            "operating_status": "not_independently_verified", "verification_status": "osm_only",
            "possible_duplicate_group": None, "observed_at": checked_at,
        }
        sources.append({"place_id": identifier, "provider": "openstreetmap", "source_id": identifier,
                        "source_url": places[identifier]["primary_source_url"], "observed_at": checked_at,
                        "source_updated_at": element.get("timestamp"), "license": "ODbL-1.0",
                        "payload_json": dump({k: v for k, v in tags.items() if k in {"name", "name:id", "name:en", "brand", "brand:wikidata", "amenity", "shop", "cuisine", "opening_hours", "addr:full", "addr:street", "addr:housenumber", "addr:suburb", "addr:city", "addr:postcode", "takeaway", "delivery", "wheelchair", "diet:halal"}})})
    google_outside = []
    for row in google:
        city, district = locate(row["latitude"], row["longitude"])
        if not city:
            google_outside.append(row["id"])
            continue
        identifier = row["id"]
        if identifier not in places:
            places[identifier] = {"id": identifier, "name": row["name"], "city": city, "district": district,
                                  "category": google_category(row["category"]), "latitude": row["latitude"], "longitude": row["longitude"],
                                  "coordinate_method": "google_listing", "address": row["address"], "cuisine": None,
                                  "opening_hours": None, "possible_duplicate_group": None, "observed_at": row["checkedAt"]}
        place = places[identifier]
        place.update(name=row["name"], address=row["address"] or place.get("address"),
                     google_rating=row["rating"], google_review_count=row["reviewCount"],
                     google_maps_url=row["mapsUrl"], photo_url=row["photoUrl"],
                     primary_source_url=row["mapsUrl"], operating_status="google_not_marked_closed",
                     verification_status="google_verified_snapshot")
        sources.append({"place_id": identifier, "provider": "google", "source_id": identifier,
                        "source_url": row["mapsUrl"], "observed_at": row["checkedAt"],
                        "source_updated_at": None, "license": "Google source terms; not ODbL",
                        "payload_json": dump(row)})
        for review in row["reviews"]:
            reviews.append({"place_id": identifier, "author": review["author"], "author_url": review["authorUrl"],
                            "rating": review["rating"], "excerpt": review["excerpt"], "source_url": row["mapsUrl"],
                            "observed_at": row.get("reviewsCheckedAt", row["checkedAt"])})
    groups = defaultdict(list)
    for row in places.values():
        if row["name"]:
            groups[normalize_name(row["name"])].append(row)
    duplicate_pairs = []
    for rows in groups.values():
        for i, a in enumerate(rows):
            for b in rows[i + 1:]:
                meters = distance((a["latitude"], a["longitude"]), (b["latitude"], b["longitude"]))
                if meters <= 75:
                    group = normalize_name(a["name"])
                    a["possible_duplicate_group"] = b["possible_duplicate_group"] = group
                    duplicate_pairs.append({"first_id": a["id"], "second_id": b["id"], "distance_m": round(meters, 1), "status": "needs_branch_review"})
    candidates = []
    for row in research["places"]:
        candidates.append({"id": row["id"], "name": row["name"], "city": row["city"], "address": row["address"],
                           "food_mentioned": row["foodMentioned"], "source_url": row["sourceUrl"],
                           "observed_at": row["checkedAt"], "google_match_status": row["googleMatchStatus"],
                           "place_id": row["appRecordId"] if row["appRecordId"] in places else None})
    result = sorted(places.values(), key=lambda r: (r["city"], r["district"] or "", r["name"] or "", r["id"]))
    if {r["city"] for r in result} != set(CITIES.values()):
        raise ValueError("Both cities must contain food records")
    osm_districts = {r["district"] for r in result if r["verification_status"] == "osm_only"}
    if osm_districts != {r["name"] for r in districts}:
        raise ValueError("Food coverage is missing a kecamatan")
    for row in result:
        assert row["city"] in CITIES.values() and row["district"], row["id"]
        assert -6.5 < row["latitude"] < -6.0 and 106.5 < row["longitude"] < 107.0
        assert row["google_rating"] is None or 1 <= row["google_rating"] <= 5
    return result, sources, reviews, candidates, duplicate_pairs, {
        "checked_at": checked_at, "record_count": len(result), "osm_food_objects_received": len(foods),
        "osm_base_timestamp": raw["osm3s"]["timestamp_osm_base"], "cities": dict(Counter(r["city"] for r in result)),
        "districts": dict(sorted(Counter((r["city"] + " / " + r["district"]) for r in result).items())),
        "categories": dict(Counter(r["category"] for r in result)),
        "google_verified_records": sum(r["google_rating"] is not None for r in result),
        "google_reviews": len(reviews), "research_candidates": len(candidates),
        "unnamed_records": sum(r["name"] is None for r in result), "missing_addresses": sum(r["address"] is None for r in result),
        "possible_duplicate_pairs": len(duplicate_pairs), "excluded_osm": excluded, "google_outside_scope": google_outside,
        "scope": "Food businesses mapped by the declared OSM tags, plus existing verified Google records; not an exhaustive census of real businesses or menus",
    }


def export(folder, places, sources, reviews, candidates, duplicate_pairs, metadata):
    folder.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=folder) as temp:
        stage = Path(temp)
        with closing(sqlite3.connect(stage / "food-database.sqlite")) as db, db:
            db.executescript((FOLDER / "schema.sql").read_text())
            for table, rows in [("places", places), ("place_sources", sources), ("google_reviews", reviews), ("research_candidates", candidates)]:
                if rows:
                    fields = list(rows[0])
                    db.executemany(f"INSERT INTO {table} ({','.join(fields)}) VALUES ({','.join('?' for _ in fields)})", [tuple(row[k] for k in fields) for row in rows])
            db.execute("INSERT INTO collection_metadata VALUES (?, ?)", ("summary", dump(metadata)))
            assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
            assert not db.execute("PRAGMA foreign_key_check").fetchall()
            assert db.execute("SELECT COUNT(*) FROM places").fetchone()[0] == len(places)
        (stage / "places.json").write_text(json.dumps({"metadata": metadata, "places": places}, ensure_ascii=False, indent=2) + "\n")
        (stage / "sources.json").write_text(json.dumps(sources, ensure_ascii=False, indent=2) + "\n")
        (stage / "summary.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
        (stage / "possible-duplicates.json").write_text(json.dumps(duplicate_pairs, ensure_ascii=False, indent=2) + "\n")
        for filename, rows in [("places.csv", places), ("research-candidates.csv", candidates)]:
            with (stage / filename).open("w", encoding="utf-8-sig", newline="") as stream:
                writer = csv.DictWriter(stream, fieldnames=list(rows[0]), lineterminator="\n")
                writer.writeheader()
                writer.writerows(rows)
        for path in stage.iterdir():
            path.replace(folder / path.name)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raw-dir", type=Path, required=True, help="Cache outside repository; raw OSM responses are not committed")
    parser.add_argument("--fetch", action="store_true", help="Fetch the two declared public Overpass queries once")
    parser.add_argument("--output", type=Path, default=FOLDER)
    args = parser.parse_args()
    args.raw_dir.mkdir(parents=True, exist_ok=True)
    if args.fetch:
        for name in ("food", "districts"):
            fetch(FOLDER / f"overpass-{name}.ql", args.raw_dir / f"{name}.json")
    raw_file, district_file = args.raw_dir / "food.json", args.raw_dir / "districts.json"
    checked_at = datetime.fromtimestamp(raw_file.stat().st_mtime, timezone.utc).isoformat()
    output = build(checked_json(raw_file), checked_json(district_file),
                   json.loads((ROOT / "src/features/catalog/data/google-places.json").read_text()),
                   json.loads((ROOT / "research/jaksel-100-2026-10-28/places.json").read_text()), checked_at)
    output[-1]["raw_sha256"] = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in [("food", raw_file), ("districts", district_file)]}
    export(args.output, *output)
    print(dump({k: v for k, v in output[-1].items() if k not in {"excluded_osm", "districts", "categories", "google_outside_scope"}}))
