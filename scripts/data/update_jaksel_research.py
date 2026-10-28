"""Attach the observed Google completion status to each of the 100 research rows."""

import argparse
import csv
import io
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from inspect_google import ROOT

FOLDER = ROOT / "research/jaksel-100-2026-10-28"


def update(enrichment):
    original = json.loads((FOLDER / "places.json").read_text())
    rows = original["places"]
    results = {item["researchId"]: item for item in enrichment}
    app = json.loads((ROOT / "src/features/catalog/data/google-places.json").read_text())
    published = {item["branchVerification"]["sourceUrl"]: item for item in app if item.get("branchVerification")}
    assert len(rows) == len(results) == 100
    for row in rows:
        result = results[row["id"]]
        google = result.get("google")
        live = published.get(row["sourceUrl"])
        status = result["status"]
        row.update(
            googleMatchStatus=status,
            publicationStatus="published_to_app" if live else "excluded_closed" if status == "closed" else "needs_verification",
            appRecordId=live["id"] if live else None,
            detailPath="/restaurant/" + live["id"].replace("/", "-") if live else None,
            googleName=google["name"] if google else None,
            googleAddress=google["address"] if google else None,
            googleMapsUrl=google["url"] if google else None,
            googleCheckedAt=google["checkedAt"] if google else None,
            googleRating=google["rating"] if google else None,
            googleReviewCount=google["reviewCount"] if google else None,
            latitude=google["latitude"] if google else None,
            longitude=google["longitude"] if google else None,
            googlePhotoUrl=live['photoUrl'] if live else google["photoUrl"] if google else None,
            googleHours=live['hours'] if live else google["hours"] if google else [],
            googleReviews=[{key: review[key] for key in ("author", "authorUrl", "rating")} for review in (live or google)["reviews"]] if (live or google) else [],
            reviewExcerptLocation="src/features/catalog/data/google-places.json#" + live["id"] if live else None,
            localPhotoPath=live["photoPath"] if live else None,
            operatingStatus="google_listing_closed" if status == "closed" else "google_listing_not_marked_closed" if google else "not_independently_verified",
            observedGoogleListings=result.get("observed", []),
        )
    meta = original["metadata"]
    meta.update(
        enrichmentCheckedAt=datetime.now(timezone.utc).isoformat(),
        googleRatingsVerified=sum(row["googleRating"] is not None for row in rows),
        verifiedPlaceLinks=sum(bool(row["googleMapsUrl"]) for row in rows),
        googleCollection="Ordinary headless Scrapling public Maps captures, without paid Places API or billing activation",
        googlePhotoReferences=sum(bool(row["googlePhotoUrl"]) for row in rows),
        googleBranchStatuses=dict(Counter(row["googleMatchStatus"] for row in rows)),
        publicationStatuses=dict(Counter(row["publicationStatus"] for row in rows)),
        publishedResearchCount=sum(row["publicationStatus"] == "published_to_app" for row in rows),
        appPlaceCount=len(app),
        googleReviewReferences=sum(len(row["googleReviews"]) for row in rows),
    )
    meta["limitations"] = [
        "Editorial coverage is not proof of current virality. Original coverage spans 2021–2026.",
        "Only branch-matched records with five unique review authors and visually inspected local photos enter the app.",
        "Closed, moved, ambiguous, or incomplete candidates retain explicit statuses; unknown fields remain null.",
        "Google scores, hours and photos are captured snapshots. The original 37 app records were not refreshed in this batch.",
        "Review text is stored once in the app catalogue; research exports keep author/rating/source references.",
        "Original Manual photo references are retained separately; downloaded Google photos are referenced by localPhotoPath.",
    ]
    extra = ["googleMatchStatus", "publicationStatus", "googleName", "googleAddress", "googleRating", "googleReviewCount", "latitude", "longitude", "googleMapsUrl", "localPhotoPath", "detailPath", "googleCheckedAt"]
    with (FOLDER / "places.csv").open(encoding="utf-8-sig", newline="") as file:
        columns = [key for key in csv.DictReader(file).fieldnames if key != "foodEvidenceExcerpt"]
    columns += [key for key in extra if key not in columns]
    stream = io.StringIO(newline="")
    writer = csv.DictWriter(stream, fieldnames=columns, lineterminator="\n")
    writer.writeheader()
    for row in rows:
        writer.writerow({key: " | ".join(row[key]) if isinstance(row[key], list) else row[key] for key in columns})
    assert len({row["id"] for row in rows}) == 100
    assert all(not row["appRecordId"] or row["appRecordId"] in {item["id"] for item in app} for row in rows)
    for filename, value in (("places.json", json.dumps(original, ensure_ascii=False, indent=2) + "\n"), ("places.csv", "\ufeff" + stream.getvalue())):
        path = FOLDER / filename
        temporary = path.with_suffix(".tmp")
        temporary.write_text(value)
        temporary.replace(path)
    notes = {
        "published_to_app": "Foto lokal, rating, koordinat dan lima ulasan tersedia di aplikasi",
        "closed": "Google menandai listing tutup; tidak ditampilkan sebagai tempat aktif",
        "needs_fields": "Belum ada lima ulasan unik atau foto yang dapat dipakai",
        "unresolved_search": "Hasil pencarian belum mengidentifikasi satu cabang yang cocok",
        "missing_coordinates": "Titik cabang belum dapat diverifikasi",
        "name_mismatch": "Nama listing berbeda dari kandidat; tidak diganti diam-diam",
        "needs_branch_review": "Alamat/cabang berbeda atau belum cukup jelas",
        "ready": "Data lengkap; foto belum dipublikasikan bila tidak lolos pemeriksaan",
    }
    report = ["# Hasil pelengkapan Google untuk 100 kandidat Jaksel", "", "28 Oktober 2026.", "",
              f"Katalog aplikasi: **{len(app)} tempat**, termasuk **{meta['publishedResearchCount']} tambahan** dari riset ini. Seluruh 100 kandidat memiliki hasil pemeriksaan, termasuk yang tidak layak ditampilkan.", "",
              f"Status Google: `{meta['googleBranchStatuses']}`.", "", "[Dataset JSON](places.json) · [CSV lengkap](places.csv)", "",
              "Data masuk melalui Scrapling headless dengan pencocokan nama/alamat. Review hanya digabung untuk CID yang sama, koordinat dalam 25 m, atau nama dan alamat cabang Google yang sama ketika satu capture tidak memuat koordinat; koordinat tetap berasal dari capture listing yang terverifikasi. Tidak ada koordinat, rating atau ulasan yang diperkirakan. Foto diunduh dan diperiksa visual untuk menolak avatar/gambar yang tidak sesuai.", "",
              "Tampilan headless lokal biasa memperlihatkan Google Maps terbatas tanpa review. Tidak ada bypass, login, stealth, API key berbayar atau aktivasi billing. Bukti review berasal dari capture Scrapling. Raw HTML ada di /tmp dan tidak dipublikasikan. Teks review tersimpan sekali di katalog aplikasi; file riset menyimpan nama penulis, skor dan tautan sumber.", "",
              "Status tutup mengikuti label Google saat pengambilan, bukan kunjungan fisik. Kandidat dengan cabang pindah, nama berbeda, lokasi ambigu, atau ulasan belum cukup tidak dipaksakan masuk. Jam buka, harga, halal dan menu yang tidak tersedia tidak diisi perkiraan. Foto referensi Manual dan liputan lama tetap ditandai terpisah dari data Google.", "",
              "## Status setiap kandidat", "", "| Kandidat | Google / aplikasi | Status | Keterangan |", "| --- | --- | --- | --- |"]
    for row in rows:
        status = row["publicationStatus"] if row["publicationStatus"] in {"published_to_app", "excluded_closed"} else row["googleMatchStatus"]
        note = notes.get("closed" if status == "excluded_closed" else status, status)
        name = row["googleName"] or "Belum cocok"
        url = row["googleMapsUrl"] or row["mapsSearchUrl"]
        report.append(f"| {row['name']} | [{name}]({url}) | {status} | {note} |")
    (FOLDER / "completion.md").write_text("\n".join(report) + "\n")
    print(json.dumps({"app": len(app), "added": meta["publishedResearchCount"], "statuses": meta["googleBranchStatuses"]}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("enrichment", type=Path)
    args = parser.parse_args()
    update(json.loads(args.enrichment.read_text()))
