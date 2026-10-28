"""Stage complete branch-matched candidates; publish only explicitly reviewed photos."""

import argparse
import hashlib
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from inspect_google import ROOT


def photo_host(url):
    parsed = urlsplit(url)
    return parsed.scheme == "https" and bool(re.fullmatch(r"lh[3-6]\.googleusercontent\.com", parsed.hostname or "")) and not re.match(r"/a-?/", parsed.path)


def download(item):
    source = item["google"]["photoUrl"]
    if not photo_host(source):
        return None
    url = re.sub(r"=w\d+-h\d+[^?]*$", "=w960-h720-k-no", source)
    try:
        with urlopen(Request(url, headers={"User-Agent": "SPOTTEDDataReview/0.1"}), timeout=20) as response:
            if not photo_host(response.url):
                return None
            mime = response.headers.get_content_type()
            raw = response.read(4_000_001)
        extension = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(mime)
        if not extension or not 5000 < len(raw) <= 4_000_000:
            return None
        if not (raw.startswith(b"\xff\xd8\xff") or raw.startswith(b"\x89PNG\r\n\x1a\n") or (raw[:4] == b"RIFF" and raw[8:12] == b"WEBP")):
            return None
        slug = item["researchId"].removeprefix("manual-")
        filename = f"jaksel-{slug}-{hashlib.sha256(raw).hexdigest()[:8]}.{extension}"
        path = ROOT / "public/google-places" / filename
        path.write_bytes(raw)
        return {**item, "photoPath": "/google-places/" + filename}
    except (OSError, ValueError):
        return None


def make_row(item):
    g = item["google"]
    assert item["status"] == "ready" and len(g["reviews"]) == 5
    assert len({r["authorUrl"].split("?")[0] for r in g["reviews"]}) == 5
    assert photo_host(g["photoUrl"]) and (ROOT / "public" / item["photoPath"].lstrip("/")).is_file()
    slug = item["researchId"].removeprefix("manual-")
    area = re.sub(r"[^a-z0-9]+", "-", item["area"].lower()).strip("-")
    days = {"Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"}
    hours = [h for h in g["hours"] if h["day"] in days]
    row = {"id": "jaksel/" + slug, "name": g["name"], "category": g["category"],
           "area": area, "areaLabel": item["area"], "latitude": g["latitude"], "longitude": g["longitude"],
           "address": g["address"], "rating": g["rating"], "reviewCount": g["reviewCount"],
           "photoUrl": g["photoUrl"], "photoPath": item["photoPath"], "hours": hours,
           "reviews": g["reviews"], "reviewsCheckedAt": g.get("reviewsCheckedAt", g["checkedAt"]), "mapsUrl": g["url"],
           "checkedAt": g["checkedAt"], "menuPhotos": [],
           "description": f"{g['name']} adalah {g['category'].lower()} di {item['area']}. Alamat: {g['address']}",
           "branchVerification": {"method": "name-and-address", "sourceUrl": item["sourceUrl"],
                                  "sourceAddress": item["sourceAddress"], "googleAddress": g["address"], "checkedAt": g["checkedAt"],
                                  "coordinateSourceUrl": g.get("coordinateSourceUrl", g["url"]),
                                  "reviewSourceUrls": g.get("reviewSourceUrls", [g["url"]])}}
    assert 1 <= row["rating"] <= 5 and row["reviewCount"] > 0
    assert len(row["description"]) <= 600
    assert len(row["hours"]) <= 7
    return row


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("enrichment", type=Path)
    cli.add_argument("--staged", type=Path, required=True)
    cli.add_argument("--approve", type=Path, help="JSON array of research IDs whose downloaded photos were visually reviewed")
    args = cli.parse_args()
    items = json.loads(args.enrichment.read_text())
    ready = [item for item in items if item["status"] == "ready"]
    if not args.approve:
        cached = {item["researchId"]: item for item in json.loads(args.staged.read_text())} if args.staged.exists() else {}
        def stage(item):
            old = cached.get(item["researchId"])
            if old and old["google"]["photoUrl"] == item["google"]["photoUrl"] and (ROOT / "public" / old["photoPath"].lstrip("/")).is_file():
                return {**item, "photoPath": old["photoPath"]}
            result = download(item)
            if result:
                return result
            for photo in item["google"].get("reviewPhotos", [])[:2]:
                if photo['url'] != item["google"]["photoUrl"]:
                    alternate = {**item, "google": {**item["google"], "photoUrl": photo['url']}}
                    result = download(alternate)
                    if result:
                        return result
            return None
        with ThreadPoolExecutor(max_workers=3) as pool:
            staged = [row for row in pool.map(stage, ready) if row]
        args.staged.write_text(json.dumps(staged, ensure_ascii=False, indent=2) + "\n")
        print(json.dumps({"ready": len(ready), "photosStaged": len(staged)}))
    else:
        approved = set(json.loads(args.approve.read_text()))
        staged = json.loads(args.staged.read_text())
        selected = [item for item in staged if item["researchId"] in approved]
        assert len(selected) == len(approved), "Approval contains an unstaged candidate"
        rows = [make_row(item) for item in selected]
        output = ROOT / "src/features/catalog/data/google-places.json"
        baseline = json.loads(output.read_text())
        existing = {row["id"] for row in baseline}
        added = [row for row in rows if row["id"] not in existing]
        refreshed = {row["id"]: row for row in rows}
        merged = [refreshed.get(row["id"], row) for row in baseline] + added
        assert len({row["id"] for row in merged}) == len(merged)
        assert len({(round(row["latitude"], 6), round(row["longitude"], 6), row["name"].casefold()) for row in merged}) == len(merged)
        assert len(merged) <= 200
        tmp = output.with_suffix(".tmp")
        tmp.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n")
        subprocess.run(["node", "scripts/data/validate_google_snapshot.mjs", str(tmp)], cwd=ROOT, check=True)
        tmp.replace(output)
        print(json.dumps({"previous": len(baseline), "added": len(added), "published": len(merged)}))
