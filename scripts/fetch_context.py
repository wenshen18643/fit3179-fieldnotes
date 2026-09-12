"""Download map boundaries and source-backed labels for the field journal."""
import csv
import io
import json
from pathlib import Path
import urllib.parse
import urllib.request
import zipfile
from fetch_data import ROOT, RAW, download

# Natural Earth's official 1:50m administrative polygon release (public domain).
MAP_URL = 'https://naturalearth.s3.amazonaws.com/50m_cultural/ne_50m_admin_1_states_provinces.zip'
download(MAP_URL, RAW / 'ne_50m_admin_1_states_provinces.zip')

# Keep an inspectable copy of the Geoscience Australia area table source.
AREA_URL = 'https://www.ga.gov.au/scientific-topics/national-location-information/dimensions/area-of-australia-states-and-territories'
download(AREA_URL, RAW / 'geoscience-areas.html')

SPECIES = ['Merops ornatus', 'Gymnorhina tibicen', 'Grallina cyanoleuca',
           'Hirundo neoxena', 'Trichoglossus moluccanus', 'Rhipidura leucophrys',
           'Malurus cyaneus', 'Manorina melanocephala', 'Eolophus roseicapilla',
           'Dacelo novaeguineae', 'Cacatua galerita', 'Zosterops lateralis',
           'Calidris ruficollis', 'Hirundapus caudacutus', 'Eudynamys orientalis',
           'Anthochaera phrygia', 'Lathamus discolor', 'Neophema chrysogaster',
           'Calidris ferruginea', 'Numenius madagascariensis', 'Pardalotus quadragintus']

def main():
    import concurrent.futures
    def fetch(scientific):
        params = [('q', 'class:Aves'), ('fq', f'species:"{scientific}"'), ('fq', 'country:Australia'), ('pageSize', 1), ('facets', 'species'), ('flimit', 1)]
        u = 'https://biocache-ws.ala.org.au/ws/occurrences/search?' + urllib.parse.urlencode(params)
        p = RAW / ('label-' + scientific.replace(' ', '-') + '.json')
        d = json.loads(download(u, p))
        rows = d.get('occurrences', [])
        row = rows[0] if rows else {}
        print(scientific, row.get('vernacularName', '(no label)'), flush=True)
        return {'scientific': scientific, 'common': row.get('vernacularName', scientific),
                'family': row.get('family'), 'source': u}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        names = list(pool.map(fetch, SPECIES))
    (ROOT / 'data' / 'species-labels.json').write_text(json.dumps(names, indent=2), encoding='utf-8')

if __name__ == '__main__':
    main()
