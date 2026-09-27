"""Extra source downloads for the map chapter. Same cache and provenance rules as fetch_data.py.

- One-degree grids per nationally threatened species, for the threatened-share map.
- ABS estimated resident population, a second denominator for the state choropleth.
"""
import concurrent.futures
import csv
import datetime
import hashlib
import json

from fetch_data import RAW, ROOT, download, query

ABS_URL = ('https://data.api.abs.gov.au/rest/data/ABS,ERP_Q,1.0.0/1.3.TOT.1+2+3+4+5+6+7+8.Q'
           '?startPeriod=2024-Q2&endPeriod=2024-Q2&format=csvfilewithlabels')


def threatened_names():
    rows = list(csv.DictReader((RAW / 'threatened-species.csv').read_text(encoding='utf-8-sig').splitlines()))
    status = {'Vulnerable', 'Endangered', 'Critically Endangered'}
    names = {r['Scientific Name'] for r in rows
             if r['Class'] == 'Aves' and r['Threatened status'] in status
             and r['Infraspecies'] == '-' and len(r['Scientific Name'].split()) == 2}
    return sorted(names)


def main():
    jobs = []
    for name in threatened_names():
        jobs.append(('threat-' + name.replace(' ', '-'), 2024, ['point-1'], [f'species:"{name}"'], None))
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        results = list(executor.map(lambda x: query(*x), jobs))
    target = RAW / 'abs-erp-2024q2.csv'
    download(ABS_URL, target)
    results.append({'file': 'data/raw/' + target.name, 'url': ABS_URL,
                    'title': 'ABS Estimated Resident Population, states and territories, June 2024',
                    'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                    'retrieved': datetime.datetime.now(datetime.timezone.utc).isoformat()})
    prov = json.loads((ROOT / 'data' / 'provenance.json').read_text(encoding='utf-8'))
    known = {s['file'] for s in prov['sources']}
    prov['sources'] += [r for r in results if r['file'] not in known]
    (ROOT / 'data' / 'provenance.json').write_text(json.dumps(prov, indent=2), encoding='utf-8')
    print('Map sources complete.')


if __name__ == '__main__':
    main()
