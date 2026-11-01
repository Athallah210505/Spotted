"""Download food-place records from public, non-requester-pays Overture GeoParquet."""

import argparse
import json
import struct
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import urlopen

from build_food_database import CITIES

QUERY = '''SELECT id,names.primary AS name,bbox,geometry,confidence,websites,socials,addresses,sources,
                  operating_status,basic_category,taxonomy
           FROM read_parquet(?)
           WHERE bbox.xmin BETWEEN ? AND ? AND bbox.ymin BETWEEN ? AND ?
             AND (list_contains(taxonomy.hierarchy,'food_and_drink')
                  OR basic_category IN ('food_and_beverage_store','food_service','coffee_shop'))'''


def read_catalog(url):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or parsed.hostname != 'stac.overturemaps.org':
        raise ValueError('Only the official public catalog is allowed')
    with urlopen(url, timeout=25) as response:
        raw = response.read(2_000_001)
    if len(raw) > 2_000_000:
        raise ValueError('Catalog response too large')
    return json.loads(raw)


def wkb_point(value):
    value = bytes(value)
    if len(value) != 21 or value[0] not in {0,1}:
        raise ValueError('Expected a 2D WKB Point')
    order = '<' if value[0] == 1 else '>'
    if struct.unpack(order+'I', value[1:5])[0] != 1:
        raise ValueError('Expected a WKB Point geometry type')
    lon, lat = struct.unpack(order+'dd', value[5:])
    if not (-180 <= lon <= 180 and -90 <= lat <= 90):
        raise ValueError('Invalid point coordinates')
    return lat, lon


def main():
    import duckdb
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--raw-dir', type=Path, required=True)
    cli.add_argument('--output', type=Path, required=True)
    args = cli.parse_args()
    boundary = json.loads((args.raw_dir / 'food.json').read_text())
    points = [p for r in boundary['elements'] if r.get('type') == 'relation' and r['id'] in CITIES for m in r['members'] for p in m.get('geometry', [])]
    if not points:
        raise ValueError('Administrative boundaries required')
    west,south,east,north = min(p['lon'] for p in points),min(p['lat'] for p in points),max(p['lon'] for p in points),max(p['lat'] for p in points)
    root = read_catalog('https://stac.overturemaps.org/catalog.json')
    release = root['latest']
    collection_url = f'https://stac.overturemaps.org/{release}/places/place/collection.json'
    collection = read_catalog(collection_url)
    links = [r['href'] for r in collection['links'] if r['rel'] == 'item']
    with ThreadPoolExecutor(max_workers=3) as pool:
        items = list(pool.map(read_catalog,links))
    assets = [r for r in items if r['bbox'][0] <= east and r['bbox'][2] >= west and r['bbox'][1] <= north and r['bbox'][3] >= south]
    urls = []
    for asset in assets:
        if asset['properties']['storage:schemes']['aws']['requester_pays'] is not False:
            raise ValueError('A paid or unknown storage configuration is not allowed')
        url = asset['assets']['aws']['href']
        parsed = urlsplit(url)
        if parsed.scheme != 'https' or parsed.hostname != 'overturemaps-us-west-2.s3.us-west-2.amazonaws.com':
            raise ValueError('Unexpected public asset host')
        urls.append(url)
    if not urls:
        raise ValueError('No source files intersect the city bounds')
    with duckdb.connect() as db:
        db.execute('INSTALL httpfs; LOAD httpfs')
        db.execute('SET enable_geoparquet_conversion=false')
        db.execute('SET threads=2')
        db.execute("SET memory_limit='512MB'")
        cursor = db.execute(QUERY, [urls, west, east, south, north])
        keys = [r[0] for r in cursor.description]
        rows = []
        for values in cursor.fetchall():
            row = dict(zip(keys, values))
            lat, lon = wkb_point(row.pop('geometry'))
            row.update(latitude=lat, longitude=lon)
            rows.append(row)
    if not rows or len({r['id'] for r in rows}) != len(rows):
        raise ValueError('Empty or duplicate source response; previous output kept')
    value = {'metadata': {'provider':'Overture Maps','release':release,'checkedAt':datetime.now(timezone.utc).isoformat(),
                          'recordCount':len(rows),'sourceCatalogUrl':collection_url,'bounds':[west,south,east,north],
                          'sourceAssets':[{'url':url,'stacId':asset['id']} for url,asset in zip(urls,assets)]},'places':rows}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    temporary = args.output.with_suffix('.tmp')
    temporary.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
    temporary.replace(args.output)
    print(json.dumps(value['metadata']),flush=True)


if __name__ == '__main__':
    main()
