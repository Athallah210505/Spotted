"""Clip public Overture food records and fill only unambiguous, source-backed addresses."""

import argparse
import json
import math
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

from build_food_database import FOLDER, geometry, contains, distance, normalize_name

EXCLUDED = {'bar', 'lounge', 'winery', 'alcoholic_beverage_venue', 'distillery', 'brewery'}


def culinary(row):
    if row['basic_category'] in EXCLUDED:
        return False
    hierarchy = (row.get('taxonomy') or {}).get('hierarchy') or []
    primary = (row.get('taxonomy') or {}).get('primary') or ''
    return 'food_and_drink' in hierarchy or row['basic_category'] == 'coffee_shop' or bool(re.search(r'bakery|patisserie|cake|pastry|donut|doughnut|dessert|ice_cream|chocol|candy|confection', primary))


def name_key(name):
    return normalize_name(name) or unicodedata.normalize('NFKC', name or '').casefold().strip()


def indexed_boundary(relation):
    boundary = geometry(relation)
    buckets = {'outer': defaultdict(list), 'inner': defaultdict(list)}
    points = []
    for role, edges in boundary['edges'].items():
        for a, b in edges:
            points.extend((a, b))
            for band in range(math.floor(min(a[1], b[1]) * 1000) - 1, math.floor(max(a[1], b[1]) * 1000) + 2):
                buckets[role][band].append((a, b))
    return {'name': boundary['name'], 'buckets': buckets, 'bounds': (min(x for x,y in points), min(y for x,y in points), max(x for x,y in points), max(y for x,y in points))}


def in_boundary(boundary, lat, lon):
    west, south, east, north = boundary['bounds']
    if not (west <= lon <= east and south <= lat <= north):
        return False
    band = math.floor(lat * 1000)
    return contains({'edges': {role: boundary['buckets'][role].get(band, []) for role in ('outer', 'inner')}}, lat, lon)


def candidate_address(row):
    options = [a for a in row.get('addresses') or [] if a.get('freeform') and a.get('country') in {None, 'ID'}]
    if not options:
        return None, None
    value = options[0]
    parts = [value['freeform'].strip()]
    for key in ('locality', 'postcode'):
        if value.get(key) and value[key].casefold() not in parts[0].casefold():
            parts.append(value[key])
    return ', '.join(parts), value.get('locality')


def address_conflict(existing, other):
    numbers = [re.search(r'\bno\.?\s*(\d+[a-z]?)', value or '', re.I) for value in (existing, other)]
    if not all(numbers):
        return False
    a, b = (n[1].casefold() for n in numbers)
    return re.match(r'\d+', a)[0] != re.match(r'\d+', b)[0] or (a[-1].isalpha() and b[-1].isalpha() and a[-1] != b[-1])


def match_places(places, candidates, aliases):
    grid = defaultdict(list)
    for row in candidates:
        if (row['confidence'] or 0) >= 0.8 and row['address'] and not row['address_locality_conflict']:
            grid[(math.floor(row['latitude'] * 1000), math.floor(row['longitude'] * 1000))].append(row)
    provisional, ambiguous = [], []
    for place in places:
        if not place['name']:
            continue
        names = {name_key(place['name']), *aliases.get(place['id'], [])} - {''}
        a, b = math.floor(place['latitude'] * 1000), math.floor(place['longitude'] * 1000)
        found = {}
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for row in grid.get((a + dx, b + dy), []):
                    if name_key(row['name']) not in names or row['city'] != place['city'] or row['district'] != place['district'] or address_conflict(place['address'], row['address']):
                        continue
                    meters = distance((place['latitude'], place['longitude']), (row['latitude'], row['longitude']))
                    if meters <= 50:
                        found[row['id']] = (row, meters)
        if len(found) == 1:
            row, meters = next(iter(found.values()))
            provisional.append({'placeId': place['id'], 'sourceId': row['id'], 'distanceM': round(meters, 2),
                                'address': row['address'], 'sourceUrl': row['source_url'], 'record': row})
        elif found:
            ambiguous.append({'placeId': place['id'], 'sourceIds': list(found), 'reason': 'multiple_source_branches'})
    owners = Counter(r['sourceId'] for r in provisional)
    matched = []
    for row in provisional:
        if owners[row['sourceId']] == 1:
            matched.append(row)
        else:
            ambiguous.append({'placeId': row['placeId'], 'sourceIds': [row['sourceId']], 'reason': 'multiple_existing_records'})
    return matched, ambiguous


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--input', type=Path, required=True)
    cli.add_argument('--raw-dir', type=Path, required=True)
    args = cli.parse_args()
    raw = json.loads(args.input.read_text())
    cities = [indexed_boundary(r) for r in json.loads((args.raw_dir / 'food.json').read_text())['elements'] if r.get('type') == 'relation' and r['id'] in {5802438, 7626001}]
    districts = [indexed_boundary(r) for r in json.loads((args.raw_dir / 'districts.json').read_text())['elements']]
    if len(cities) != 2 or len(districts) != 18:
        raise ValueError('Expected both cities and all 18 kecamatan')
    clipped, exclusions = [], Counter()
    source_url = raw['metadata']['sourceAssets'][0]['url']
    for row in raw['places']:
        if not culinary(row):
            exclusions['excluded_non_culinary_category'] += 1
            continue
        lat, lon = row['latitude'], row['longitude']
        if not all(type(v) in (int,float) and math.isfinite(v) for v in (lat,lon)):
            raise ValueError('Invalid source coordinates')
        city = [b['name'] for b in cities if in_boundary(b, lat, lon)]
        if len(city) != 1:
            exclusions['outside_or_boundary_city'] += 1
            continue
        district = [b['name'] for b in districts if in_boundary(b, lat, lon)]
        if len(district) != 1:
            exclusions['ambiguous_district'] += 1
            continue
        address, locality = candidate_address(row)
        conflict = bool(re.search(r'bogor|depok|bekasi|tangerang|bandung|cibinong|banten', locality or '', re.I))
        clipped.append({'id': row['id'], 'name': row['name'], 'city': city[0], 'district': district[0],
                        'latitude': lat, 'longitude': lon, 'category': row['basic_category'], 'source_category': (row.get('taxonomy') or {}).get('primary'),
                        'address': address, 'address_locality_conflict': conflict, 'confidence': row['confidence'],
                        'operating_status': row['operating_status'], 'sources': row['sources'], 'source_url': source_url,
                        'source_release': raw['metadata']['release'], 'checked_at': raw['metadata']['checkedAt']})
    if not clipped or len({r['id'] for r in clipped}) != len(clipped):
        raise ValueError('Empty or duplicate source snapshot')
    places = json.loads((FOLDER / 'places.json').read_text())['places']
    aliases = defaultdict(set)
    for source in json.loads((FOLDER / 'sources.json').read_text()):
        if source['provider'] == 'openstreetmap':
            for key, value in json.loads(source['payload_json']).items():
                if key == 'name' or re.fullmatch(r'name:[a-z]{2,3}', key):
                    aliases[source['place_id']].add(name_key(value))
    matches, ambiguous = match_places(places, clipped, aliases)
    missing = {r['id'] for r in places if not r['address']}
    meta = {**raw['metadata'], 'recordCount': len(clipped), 'bboxSourceCount': len(raw['places']),
            'cities': dict(Counter(r['city'] for r in clipped)), 'exclusions': dict(exclusions),
            'matchedRecords': len(matches), 'missingAddressesMatched': sum(r['placeId'] in missing for r in matches),
            'ambiguousMatches': len(ambiguous), 'googleRatingsIncluded': False}
    for name, value in [('overture-places.json', {'metadata': meta, 'places': clipped}),
                        ('overture-enrichment.json', {'metadata': meta, 'matches': matches, 'ambiguous': ambiguous})]:
        target = FOLDER / name
        temp = target.with_suffix('.tmp')
        temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
        temp.replace(target)
    print(json.dumps(meta), flush=True)


if __name__ == '__main__':
    main()
