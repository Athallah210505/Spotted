"""Inspect Google captures for research candidates; never replace published data here."""

import argparse
import json
import re
import unicodedata
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from scrapling.parser import Selector
from inspect_google import ROOT, parse_reviews, text, distance


def normalized(value):
    value = unicodedata.normalize("NFKD", value).casefold()
    value = "".join(c for c in value if not unicodedata.combining(c)).replace("&", " and ").replace("'", "").replace("’", "")
    return " ".join(re.findall(r"[a-z0-9]+", value))


def inspect(raw):
    page = Selector(raw["html"])
    name = text(page.css("h1"))
    if not name or name in {"Hasil", "Results"}:
        return {"status": "unresolved_search", "url": raw["url"]}
    closed = [text([n]).casefold() for n in page.css(".fCEvvc")]
    closed_reason = next((n for n in closed if n in {"tutup permanen", "tutup sementara", "permanently closed", "temporarily closed"}), None)
    direct = re.search(r"!3d(-?[\d.]+)!4d(-?[\d.]+)", raw["url"])
    coords = re.search(r"!1x(\d+)!2x(\d+)", raw["html"])
    if direct:
        lat, lon = map(float, direct.groups())
    elif coords:
        lat, lon = [(int(v) - (2**32 if int(v) >= 2**31 else 0)) / 10**7 for v in coords.groups()]
    else:
        lat, lon = None, None
    if lat is not None and not (-6.45 <= lat <= -6.10 and 106.68 <= lon <= 106.95):
        return {"status": "outside_jakarta", "name": name, "latitude": lat, "longitude": lon}
    cid = re.search(r"0x[0-9a-f]+:0x([0-9a-f]+)", raw["url"])
    cid_value = cid.group(1) if cid else None
    query_cid = parse_qs(urlsplit(raw["url"]).query).get("cid", [""])[0]
    if query_cid.isdigit():
        cid_value = format(int(query_cid), "x")
    if not cid_value:
        selected_ids = set()
        for link in page.css('link[rel="preload"]'):
            href = link.attrib.get("href", "")
            identity = re.search(r"!1y\d+!2y(\d+)", href)
            point = re.search(r"!1x(\d+)!2x(\d+)", href)
            if identity and point:
                xy = [(int(v) - (2**32 if int(v) >= 2**31 else 0)) / 10**7 for v in point.groups()]
                if lat is not None and distance((lat, lon), tuple(xy)) < 1:
                    selected_ids.add(format(int(identity.group(1)), "x"))
        if len(selected_ids) == 1:
            cid_value = selected_ids.pop()
    if not cid_value:
        preview_ids = set()
        for link in page.css('link[rel="preload"]'):
            href = unquote(link.attrib.get("href", ""))
            match = re.search(r"!1s0x[0-9a-f]+:0x([0-9a-f]+)", href)
            if '/maps/preview/place?' in href and match:
                preview_ids.add(match.group(1))
        if len(preview_ids) == 1:
            cid_value = preview_ids.pop()
    address = page.css('[data-item-id="address"]')
    address = address[0].attrib.get("aria-label", "") if address else ""
    address = re.sub(r"^(?:Alamat|Address):\s*", "", address).strip()
    scores = page.css('.F7nice [role="img"][aria-label]')
    rating = next((float(m.group(1).replace(",", ".")) for n in scores
                   if (m := re.match(r"^(\d(?:[.,]\d+)?) (?:bintang|stars?)", n.attrib.get("aria-label", "")))), None)
    count = re.search(r"\(([\d.,]+)\)", text(page.css(".F7nice")))
    photos = page.css('button[aria-label^="Foto"]:not([data-review-id]) > img, button[aria-label^="Photo"]:not([data-review-id]) > img')
    photo = next((n.attrib["src"] for n in photos if
                  re.fullmatch(r"lh[3-6]\.googleusercontent\.com", urlsplit(n.attrib.get("src", "")).hostname or "")
                  and not re.match(r"/a-?/", urlsplit(n.attrib["src"]).path)), None)
    review_photos = []
    for review in page.css('div[data-review-id][aria-label]'):
        profile = review.css('button[data-href*="/maps/contrib/"]')
        if not profile:
            continue
        for button in review.css('button[data-photo-index][style]'):
            match = re.search(r'url\([\"\']?([^\"\')]+)', button.attrib.get('style', ''))
            if not match:
                continue
            url = match.group(1)
            image = urlsplit(url)
            if image.scheme == 'https' and re.fullmatch(r'lh[3-6]\.googleusercontent\.com', image.hostname or '') and not re.match(r'/a-?/', image.path):
                review_photos.append({'url': url, 'caption': button.attrib.get('data-tooltip', ''), 'author': review.attrib['aria-label'], 'authorUrl': profile[0].attrib['data-href']})
    if not photo and review_photos:
        photo = review_photos[0]['url']
    hours = []
    for row in page.css("table.eK4R0e tr"):
        cells = row.css("td")
        if len(cells) >= 2:
            hours.append({"day": text(cells[:1]), "text": text(cells[1:2])})
    reviews = parse_reviews(page)
    return {"status": "closed" if closed_reason else "captured" if lat is not None else "missing_coordinates", "closedReason": closed_reason, "name": name, "address": address,
            "latitude": lat, "longitude": lon, "cid": cid_value,
            "rating": rating, "reviewCount": int(re.sub(r"[.,]", "", count.group(1))) if count else None,
            "photoUrl": photo, "hours": hours, "reviews": reviews, "reviewPhotos": review_photos,
            "category": text(page.css("button.DkEaL")) or "Tempat makan",
            "url": raw["url"], "checkedAt": raw["checkedAt"], "language": page.css('html::attr(lang)').get() or parse_qs(urlsplit(raw["url"]).query).get('hl', [None])[0]}


def address_evidence(candidate, actual):
    source, target = normalized(candidate), normalized(actual)
    if not ("jakarta" in target):
        return False
    def address_words(value):
        value = re.sub(r"\biiia\b", "iii a", value)
        value = re.sub(r"\b(?:jl|jalan|ji|raya)\b", " ", value)
        value = value.replace("komp bappenas", "")
        value = value.replace("wijaya grand", "grand wijaya").replace("centre", "center")
        value = re.sub(r"\bi\b", "1", value)
        return " ".join(value.split())
    original_street = re.search(r"\b(?:jl\.?|jalan|ji\.?)\s+([^,]+)", candidate, re.I)
    street = re.search(r"\b(?:jl|jalan|ji)\s+(.+)", normalized(original_street.group(0))) if original_street else None
    if street:
        stem = re.split(r"\b(?:no|nomor|kav|blok|rt|rw)\b", street.group(1))[0].strip()
        # The street and its written number must agree; a shared city is insufficient.
        street_match = bool(stem) and address_words(stem) in address_words(target)
        number = re.search(r"\b(?:no|nomor)\s*(\d+[a-z]?)", street.group(1))
        actual_number = re.search(r"\bno\s*(\d+[a-z]?)", target)
        number_match = not number or not actual_number
        if number and actual_number:
            left, right = number.group(1), actual_number.group(1)
            number_match = re.match(r"\d+", left).group() == re.match(r"\d+", right).group() and (not left[-1].isalpha() or not right[-1].isalpha() or left[-1] == right[-1])
        if street_match and number_match:
            return True
    # Mall tenants can share a street but must retain the source's named complex.
    for complex_name in ("ashta", "scbd park", "grand wijaya", "the langham", "pondok indah", "one satrio", "darmawangsa square", "district 8", "fairgrounds"):
        if complex_name in address_words(source) and complex_name in address_words(target):
            return True
    return False


def name_evidence(expected, actual):
    expected, actual = normalized(expected), normalized(actual)
    expected = expected.replace("rumah makan", "rm").replace("r m ", "rm ")
    actual = actual.replace("rumah makan", "rm").replace("r m ", "rm ")
    ignore = {"cafe", "coffee", "kopi", "restaurant", "restoran", "rm", "house", "by", "the", "senopati", "scbd", "blok", "m", "jakarta", "bistro", "patisserie", "general", "store", "warung", "nasi", "goreng", "fried", "rice", "stall", "sate", "kambing", "tengkleng", "thengkleng", "rica", "and", "dan"}
    tokens = set(expected.split()) - ignore
    return bool(tokens) and (tokens <= set(actual.split()) or expected in actual or actual in expected)


def summarize(candidates, folder):
    output = []
    for candidate in candidates:
        captures = []
        errors = []
        for file in sorted(folder.glob(candidate["id"] + "-*.json")):
            try:
                capture = inspect(json.loads(file.read_text()))
                captures.append(capture)
            except (ValueError, KeyError, TypeError) as error:
                errors.append(str(error))
        valid = [c for c in captures if c["status"] == "captured" and name_evidence(candidate["name"], c["name"])]
        known = {c["cid"]: c for c in valid if c["cid"] and address_evidence(candidate["address"], c["address"])}
        for capture in captures:
            baseline_point = known.get(capture.get("cid"))
            if not baseline_point and capture["status"] == "missing_coordinates":
                baseline_point = next((c for c in valid if name_evidence(c["name"], capture["name"]) and address_evidence(c["address"], capture["address"]) and not (c["cid"] and capture.get("cid") and c["cid"] != capture["cid"])), None)
            if capture["status"] == "missing_coordinates" and baseline_point and name_evidence(candidate["name"], capture["name"]) and address_evidence(candidate["address"], capture["address"]):
                capture.update(latitude=baseline_point["latitude"], longitude=baseline_point["longitude"], status="captured", coordinateSourceUrl=baseline_point["url"])
                valid.append(capture)
        matched = [c for c in valid if address_evidence(candidate["address"], c["address"])]
        matched.sort(key=lambda c: (bool(c["reviewCount"]), bool(c["rating"]), c.get("language") == "id", bool(c["photoUrl"]), len(c["hours"])), reverse=True)
        baseline = matched[0] if matched else None
        if not baseline:
            closed_match = next((c for c in captures if c['status'] == 'closed' and name_evidence(candidate['name'], c['name']) and address_evidence(candidate['address'], c['address'])), None)
            excluded = {"researchId": candidate["id"], "researchName": candidate["name"],
                           "sourceAddress": candidate["address"], "status": "needs_branch_review" if valid else ("name_mismatch" if any(c["status"] == "captured" for c in captures) else captures[0]["status"] if captures else "not_captured"),
                           "observed": [{k: c.get(k) for k in ("status", "name", "address", "url", "closedReason")} for c in captures], "errors": errors}
            if closed_match:
                excluded.update(google=closed_match, status='closed', reviewsFound=len(closed_match['reviews']))
            output.append(excluded)
            continue
        reviews = {}
        review_sources = []
        review_dates = []
        for capture in valid:
            if distance((baseline["latitude"], baseline["longitude"]), (capture["latitude"], capture["longitude"])) > 25:
                continue
            if baseline["cid"] and capture["cid"] and baseline["cid"] != capture["cid"]:
                continue
            if not baseline["cid"] and capture["cid"]:
                baseline["cid"] = capture["cid"]
            if not baseline["photoUrl"] and capture["photoUrl"]:
                baseline["photoUrl"] = capture["photoUrl"]
            for review in capture["reviews"]:
                reviews[urlsplit(review["authorUrl"]).path] = review
            if capture["reviews"]:
                review_sources.append(capture["url"])
                review_dates.append(capture["checkedAt"])
        baseline["reviews"] = list(reviews.values())[:5]
        baseline["reviewSourceUrls"] = list(dict.fromkeys(review_sources))
        baseline["reviewsCheckedAt"] = max(review_dates) if review_dates else baseline["checkedAt"]
        baseline["status"] = "ready" if (len(reviews) >= 5 and baseline["rating"] and baseline["reviewCount"] and baseline["photoUrl"]) else "needs_fields"
        output.append({"researchId": candidate["id"], "researchName": candidate["name"], "sourceAddress": candidate["address"],
                       "area": candidate["area"], "sourceUrl": candidate["sourceUrl"], "google": baseline,
                       "status": baseline["status"], "reviewsFound": len(reviews)})
    return output


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("captures", type=Path)
    cli.add_argument("--output", type=Path, required=True)
    args = cli.parse_args()
    source = ROOT / "research/jaksel-100-2026-10-28/places.json"
    result = summarize(json.loads(source.read_text())["places"], args.captures)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    from collections import Counter
    print(json.dumps(dict(Counter(r["status"] for r in result))))
