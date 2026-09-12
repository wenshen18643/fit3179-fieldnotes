"""Reproducible source downloads. No invented observation rows.

The ALA API computes exhaustive facets; this is not a sample of first-N records.
Cached responses make reruns polite and preserve the retrieval snapshot.
"""
import concurrent.futures
import csv
import datetime
import hashlib
import io
import json
from pathlib import Path
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data' / 'raw'
RAW.mkdir(parents=True, exist_ok=True)
STATES = ['Western Australia', 'Northern Territory', 'South Australia', 'Queensland',
          'New South Wales', 'Victoria', 'Tasmania', 'Australian Capital Territory']
BASE = ['country:Australia', 'basis_of_record:HUMAN_OBSERVATION',
        'occurrence_status:PRESENT', 'geospatial_kosher:true', 'month:[1 TO 12]',
        'decimalLatitude:[-44 TO -10]', 'decimalLongitude:[112 TO 154]',
        'state:(' + ' OR '.join('"' + s + '"' for s in STATES) + ')']
PROVIDERS = {'dr2009': 'eBird Australia', 'dr359': 'BirdLife Australia, Birdata',
             'dr1411': 'iNaturalist Australia'}

def download(url, target):
    if target.exists():
        return target.read_bytes()
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'FIT3179-birdwatching-educational-visualisation/1.0'})
            with urllib.request.urlopen(req, timeout=90) as response:
                b = response.read()
            target.write_bytes(b)
            return b
        except Exception:
            if attempt == 3:
                raise
            time.sleep(2 ** (attempt + 1))

def query(name, year, facets, filters=None, provider=None):
    filters = BASE + [f'year:{year}'] + (filters or [])
    filters += [f'data_resource_uid:{provider}' if provider else 'data_resource_uid:(dr2009 OR dr359 OR dr1411)']
    params = [('q', 'class:Aves'), ('pageSize', 0), ('flimit', 10000), ('fsort', 'index')]
    params += [('fq', f) for f in filters] + [('facets', f) for f in facets]
    url = 'https://biocache-ws.ala.org.au/ws/occurrences/search?' + urllib.parse.urlencode(params)
    target = RAW / (name + '.json')
    response = json.loads(download(url, target))
    if response.get('status') != 'OK':
        raise RuntimeError(f'{name}: invalid response {response}')
    manifest = {'file': 'data/raw/' + target.name, 'url': url,
                'retrieved': datetime.datetime.fromtimestamp(target.stat().st_mtime, datetime.timezone.utc).isoformat(),
                'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                'total': response['totalRecords']}
    print(name, response['totalRecords'], flush=True)
    return manifest

def main():
    jobs = [('overview-2024', 2024, ['state', 'month', 'data_resource_uid', 'species', 'family', 'point-1'], None, None)]
    for m in range(1, 13):
        jobs.append((f'month-2024-{m:02}', 2024, ['state', 'species', 'family', 'point-1', 'data_resource_uid'], [f'month:{m}'], None))
        jobs.append((f'inat-2025-{m:02}', 2025, ['species', 'state'], [f'month:{m}'], 'dr1411'))
        jobs.append((f'bee-eater-2024-{m:02}', 2024, ['point-1', 'state'], [f'month:{m}', 'species:"Merops ornatus"'], None))
    jobs.append(('inat-species-2024', 2024, ['species'], None, 'dr1411'))
    jobs.append(('inat-species-2025', 2025, ['species'], None, 'dr1411'))
    for year in [2024, 2025, 2026]:
        for provider in PROVIDERS:
            jobs.append((f'coverage-{year}-{provider}', year, ['month', 'state', 'license'], None, provider))
    for state in STATES:
        key = state.lower().replace(' ', '-')
        jobs.append((f'state-{key}', 2024, ['species', 'family', 'data_resource_uid'], [f'state:"{state}"'], None))
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        results = list(executor.map(lambda x: query(*x), jobs))
    for uid in PROVIDERS:
        url = f'https://collections.ala.org.au/ws/dataResource/{uid}'
        target = RAW / f'provider-{uid}.json'
        download(url, target)
    ckan = 'https://data.gov.au/data/api/3/action/package_show?id=threatened-species-state-lists'
    meta = json.loads(download(ckan, RAW / 'dcceew-metadata.json'))
    res = next(r for r in meta['result']['resources'] if r['name'].startswith('Threatened Species'))
    download(res['url'], RAW / 'threatened-species.csv')
    results.append({'file': 'data/raw/threatened-species.csv', 'url': res['url'], 'title': res['name'],
                    'license': meta['result'].get('license_title'), 'retrieved': datetime.datetime.now(datetime.timezone.utc).isoformat()})
    (ROOT / 'data' / 'provenance.json').write_text(json.dumps({'scope': BASE, 'sources': results}, indent=2), encoding='utf-8')
    print('Source snapshot complete.', flush=True)

if __name__ == '__main__':
    main()
