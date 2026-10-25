"""Merge inspected headless captures without publishing a partial review refresh."""
import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlsplit
from scrapling.parser import Selector
from inspect_google import ROOT, distance, maps_url, parse_page, parse_reviews, same_name, text


def merge_reviews(places, captures, baseline):
    captures = list(captures)
    matched = {p['id']: p for p in places}
    collected = {p['id']: {} for p in places}
    dates = {}
    for raw in baseline:
        place = matched.get(raw['id'])
        if place and parse_page(raw, place):
            captures.append(raw)
    for raw in captures:
        place = matched.get(raw['id'])
        if not place or not maps_url(raw['url']): continue
        page = Selector(raw['html'])
        if not same_name(place['name'], text(page.css('h1'))): continue
        # Accept the matched query URL or an observed direct link within 50 m of that branch.
        source, original = urlsplit(raw['url']), urlsplit(place['mapsUrl'])
        if (source.scheme, source.hostname, source.path) != (original.scheme, original.hostname, original.path):
            coords = re.search(r'!3d(-?[\d.]+)!4d(-?[\d.]+)', raw['url'])
            if not coords or distance(tuple(map(float,coords.groups())), (place['latitude'],place['longitude']))>50: continue
        for review in parse_reviews(page):
            collected[place['id']][urlsplit(review['authorUrl']).path] = review
        dates[place['id']] = max(dates.get(place['id'], ''), raw['checkedAt'])
    shortfalls = {p['name']: len(collected[p['id']]) for p in places if len(collected[p['id']]) < 5}
    if shortfalls: raise ValueError(json.dumps(shortfalls, ensure_ascii=False))
    return [{**p, 'reviews': list(collected[p['id']].values())[:5], 'reviewsCheckedAt': dates[p['id']]} for p in places]


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('captures', type=Path)
    cli.add_argument('--baseline', type=Path, required=True)
    args = cli.parse_args()
    output = ROOT/'src/features/catalog/data/google-places.json'
    places = json.loads(output.read_text())
    captures = [json.loads(path.read_text()) for path in args.captures.glob('*.json')]
    try:
        rows = merge_reviews(places, captures, json.loads(args.baseline.read_text()))
    except ValueError as error:
        cli.exit(1, f'Snapshot unchanged; fewer than five verified reviews: {error}\n')
    temporary = output.with_suffix('.tmp')
    temporary.write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n')
    temporary.replace(output)
    print(json.dumps({'places':len(rows), 'reviews':sum(len(p['reviews']) for p in rows)}))
