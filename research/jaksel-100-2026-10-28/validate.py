"""Check the research export without requesting websites or changing app data."""

import csv
import json
import re
from collections import Counter
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

FOLDER = Path(__file__).resolve().parent
ROOT = FOLDER.parents[1]


def normalize(value):
    return re.sub(r"\W", "", value.casefold())


def validate():
    data = json.loads((FOLDER / "places.json").read_text())
    rows = data["places"]
    metadata = data["metadata"]
    assert len(rows) == metadata["recordCount"] == 100
    for field in ("id", "sourceUrl"):
        assert len({row[field] for row in rows}) == 100, field
    assert len({normalize(row["name"]) for row in rows}) == 100

    for row in rows:
        assert row["name"] and row["address"] and row["area"]
        assert row["city"] == "Jakarta Selatan"
        assert row["sourceLocality"] in {"Jakarta Selatan", "South Jakarta"}
        assert row["foodType"] in {"Makanan", "Dessert/bakery"}
        excerpt = row["foodEvidenceExcerpt"]
        assert row["foodMentioned"].casefold() in excerpt.casefold()
        assert len(excerpt.split()) <= 25
        assert re.fullmatch(r"[a-f0-9]{64}", row["sourceSha256"])
        source = urlsplit(row["sourceUrl"])
        assert source.scheme == "https" and source.hostname == "manual.co.id"
        assert source.path.startswith("/directory/")
        checked = datetime.fromisoformat(row["checkedAt"])
        published = datetime.fromisoformat(row["sourcePublishedAt"])
        assert checked.tzinfo and published.tzinfo and published <= checked
        assert checked.date().isoformat() == "2026-10-28"
        maps = urlsplit(row["mapsSearchUrl"])
        assert maps.scheme == "https" and maps.hostname == "www.google.com"
        assert maps.path == "/maps/search/"
        assert parse_qs(maps.query)["query"] == [
            row["name"] + " " + row["address"] + " Jakarta Selatan"
        ]
        assert row["mapsLinkType"] == "generated_search_not_verified_place"
        if row["photoReferenceUrl"]:
            photo = urlsplit(row["photoReferenceUrl"])
            assert photo.scheme == "https" and photo.hostname == "manual.co.id"
            assert photo.path.startswith("/wp-content/uploads/")
            assert not photo.path.endswith("manual-cover.jpg")
        assert row["publicationStatus"] == "research_candidate_not_app_published"
        assert row["popularityBasis"] == "culinary_editorial_coverage"
        assert row["currentViralStatus"] == "not_verified"
        assert row["operatingStatus"] == "not_independently_verified"
        for unknown in (
            "googleRating", "googleReviewCount", "latitude", "longitude",
            "currentMenuPrice", "halalStatus",
        ):
            assert row[unknown] is None, (row["name"], unknown)
        assert row["googleReviews"] == []

    assert metadata["foodTypes"] == dict(Counter(r["foodType"] for r in rows))
    assert metadata["areas"] == dict(Counter(r["area"] for r in rows))
    assert metadata["sourcePublicationYears"] == dict(
        Counter(r["sourcePublishedAt"][:4] for r in rows)
    )
    assert sum(bool(r["photoReferenceUrl"]) for r in rows) == metadata["photoReferences"] == 98
    assert sum(bool(r["hoursAsPublished"]) for r in rows) == metadata["publishedHours"] == 98

    with (FOLDER / "places.csv").open(encoding="utf-8-sig", newline="") as file:
        exported = list(csv.DictReader(file))
    assert len(exported) == 100
    for row, csv_row in zip(rows, exported):
        for field, value in csv_row.items():
            expected = row[field]
            if isinstance(expected, list):
                expected = " | ".join(expected)
            assert value == (expected or ""), (row["name"], field)

    app = json.loads((ROOT / "src/features/catalog/data/google-places.json").read_text())
    overlap = {normalize(r["name"]) for r in app} & {normalize(r["name"]) for r in rows}
    assert not overlap, overlap
    report = (FOLDER / "README.md").read_text()
    assert all(row["sourceUrl"] in report for row in rows)
    print("PASS: 100 unique Jakarta Selatan venue/food records; CSV, JSON and report agree.")
    print("98 photo references; 98 source-hour snapshots; no fabricated Google fields.")


if __name__ == "__main__":
    validate()
