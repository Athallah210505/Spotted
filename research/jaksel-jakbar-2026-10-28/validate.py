"""Validate the delivered database against both portable exports and provenance."""

import csv
import json
import sqlite3
from contextlib import closing
from pathlib import Path

FOLDER = Path(__file__).resolve().parent
payload = json.loads((FOLDER / "places.json").read_text())
rows, summary = payload["places"], payload["metadata"]
sources = json.loads((FOLDER / "sources.json").read_text())
assert summary == json.loads((FOLDER / "summary.json").read_text())
assert len(rows) == summary["record_count"] == len({r["id"] for r in rows})
assert len(summary["districts"]) == 18
assert sum(summary["cities"].values()) == len(rows)
assert len([s for s in sources if s["provider"] == "openstreetmap"]) == summary["osm_food_objects_received"] - len(summary["excluded_osm"])
with (FOLDER / "places.csv").open(encoding="utf-8-sig", newline="") as stream:
    csv_rows = list(csv.DictReader(stream))
assert len(csv_rows) == len(rows)
for actual, expected in zip(csv_rows, rows):
    assert actual == {key: "" if value is None else str(value) for key, value in expected.items()}
with closing(sqlite3.connect(f"file:{FOLDER / 'food-database.sqlite'}?mode=ro", uri=True)) as db:
    db.row_factory = sqlite3.Row
    assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    assert not db.execute("PRAGMA foreign_key_check").fetchall()
    actual = {r["id"]: dict(r) for r in db.execute("SELECT * FROM places")}
    assert actual == {r["id"]: r for r in rows}
    db_sources = [dict(r) for r in db.execute("SELECT * FROM place_sources")]
    assert sorted(db_sources, key=lambda r: (r["provider"], r["source_id"])) == sorted(sources, key=lambda r: (r["provider"], r["source_id"]))
    assert json.loads(db.execute("SELECT value FROM collection_metadata WHERE key='summary'").fetchone()[0]) == summary
    for row in rows:
        providers = [s for s in sources if s["place_id"] == row["id"]]
        assert providers and row["district"] and row["city"] in summary["cities"]
        reviews = list(db.execute("SELECT author_url,rating FROM google_reviews WHERE place_id=?", (row["id"],)))
        if row["google_rating"] is None:
            assert not reviews and row["google_review_count"] is None
            assert row["google_maps_url"] is None and row["photo_url"] is None
        else:
            google = next(s for s in providers if s["provider"] == "google")
            source = json.loads(google["payload_json"])
            assert row["google_rating"] == source["rating"]
            assert row["google_review_count"] == source["reviewCount"]
            assert len(reviews) == len({r[0] for r in reviews}) == 5
    assert db.execute("SELECT COUNT(*) FROM google_reviews").fetchone()[0] == summary["google_reviews"]
    assert db.execute("SELECT COUNT(*) FROM research_candidates").fetchone()[0] == summary["research_candidates"]
    print(f"PASS: {len(rows)} database records, 18 kecamatan, matching CSV/JSON/SQLite, source-backed Google fields and valid foreign keys.")
