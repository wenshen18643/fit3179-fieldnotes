"""Derive small chart-ready tables from the archived, exhaustive ALA facets."""
import calendar
from collections import Counter, defaultdict
import csv
import io
import json
import math
from pathlib import Path
import zipfile
import shapefile
from fetch_data import ROOT, RAW, STATES, PROVIDERS

OUT = ROOT / 'data' / 'processed'
OUT.mkdir(parents=True, exist_ok=True)
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
CODES = {'Western Australia': 'WA', 'Northern Territory': 'NT', 'South Australia': 'SA',
         'Queensland': 'QLD', 'New South Wales': 'NSW', 'Victoria': 'VIC',
         'Tasmania': 'TAS', 'Australian Capital Territory': 'ACT'}
AREAS = dict(zip(['Western Australia', 'Queensland', 'Northern Territory', 'South Australia',
                 'New South Wales', 'Victoria', 'Tasmania', 'Australian Capital Territory'],
                [2527013, 1729742, 1347791, 984321, 801150, 227444, 68401, 2358]))
CENTRES = {'WA': [122,-26], 'NT':[133.3,-19.5], 'SA':[135,-30.5], 'QLD':[145,-23],
           'NSW':[147,-32.2], 'VIC':[144,-37], 'TAS':[146.5,-42], 'ACT':[149.05,-35.45]}
SEASONS = {1:'Summer', 2:'Summer', 3:'Autumn', 4:'Autumn', 5:'Autumn',
           6:'Winter', 7:'Winter', 8:'Winter', 9:'Spring', 10:'Spring', 11:'Spring', 12:'Summer'}
STATUS = ['Vulnerable', 'Endangered', 'Critically Endangered']

def raw(name):
    return json.loads((RAW / f'{name}.json').read_text(encoding='utf-8'))

def facet(d, field, include_missing=False):
    if d['totalRecords'] == 0:
        return {}
    rows = next(f['fieldResult'] for f in d['facetResults'] if f['fieldName'] == field)
    assert len(rows) < 10000, 'Facet truncated; page the endpoint before continuing.'
    return {r['label']: r['count'] for r in rows if include_missing or r['label'] != 'Not supplied'}

def save(name, rows):
    (OUT / f'{name}.json').write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    if rows and isinstance(rows, list) and isinstance(rows[0], dict):
        keys = list(dict.fromkeys(k for row in rows for k in row))
        with (OUT / f'{name}.csv').open('w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, keys)
            w.writeheader()
            for row in rows:
                w.writerow({k: json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else v for k,v in row.items()})

def weighted_median(rows):
    total = sum(n for x,n in rows)
    running = 0
    for x,n in sorted(rows):
        running += n
        if running >= total/2:
            return x

def maps():
    with zipfile.ZipFile(RAW / 'ne_50m_admin_1_states_provinces.zip') as z:
        r = shapefile.Reader(shp=io.BytesIO(z.read('ne_50m_admin_1_states_provinces.shp')),
                             shx=io.BytesIO(z.read('ne_50m_admin_1_states_provinces.shx')),
                             dbf=io.BytesIO(z.read('ne_50m_admin_1_states_provinces.dbf')),
                             encoding='utf-8')
        fs=[]
        for sr in r.iterShapeRecords():
            p = sr.record.as_dict()
            if p.get('admin') != 'Australia' or p.get('name') not in CODES:
                continue
            geom = sr.shape.__geo_interface__
            # Preserve Natural Earth's clockwise outer-ring orientation, suitable for d3-geo.
            def rounded(v):
                return [rounded(x) for x in v] if isinstance(v,(list,tuple)) else round(v,4)
            geom['coordinates'] = rounded(geom['coordinates'])
            fs.append({'type':'Feature','properties':{'name':p['name'],'code':CODES[p['name']]},'geometry':geom})
        assert len(fs)==8, f'Expected eight map jurisdictions, got {len(fs)}.'
        save('australia',{'type':'FeatureCollection','features':fs})

def main():
    d=raw('overview-2024')
    total=d['totalRecords']
    species=facet(d,'species')
    families=facet(d,'family',True)
    labels=json.loads((ROOT/'data'/'species-labels.json').read_text(encoding='utf-8'))
    common={x['scientific']:x['common'] for x in labels}
    # Shorter display names retain the exact sourced taxon identity in scientific labels.
    common['Grallina cyanoleuca']='Magpie-lark'
    common['Trichoglossus moluccanus']='Rainbow Lorikeet'
    state_counts=facet(d,'state')
    assert sum(state_counts.values())==total
    assert sum(facet(d,'species',True).values())==total
    assert sum(families.values())==total

    state_rows=[]
    for state in STATES:
        sd=raw('state-'+state.lower().replace(' ','-'))
        code=CODES[state]
        state_rows.append({'state':state,'code':code,'count':state_counts[state],
                           'area':AREAS[state],'density':round(state_counts[state]/AREAS[state]*1000,3),
                           'species':len(facet(sd,'species')),'longitude':CENTRES[code][0],'latitude':CENTRES[code][1]})
    save('states',state_rows)
    save('areas',[{'state':s,'area_km2':a,'source':'Geoscience Australia: Area of Australia - States and Territories (2014 table)'} for s,a in AREAS.items()])
    grid=[]
    for cell,count in facet(d,'point-1').items():
        lat,lon=map(float,cell.split(','))
        grid.append({'latitude':lat,'longitude':lon,'count':count,'cell':cell})
    assert sum(r['count'] for r in grid)==total
    # Rank cells from busiest down and keep the running share before each one, so the
    # atlas can light the fewest squares that together hold a given share of records.
    running=0
    for i,r in enumerate(sorted(grid,key=lambda r:-r['count'])):
        r['rank']=i+1; r['cumBefore']=round(running/total,6); running+=r['count']
    save('grid',grid)

    monthly=[]
    state_month=[]
    species_month=[]
    top=sorted(species,key=species.get,reverse=True)[:7]
    selected=[x for x in common if x in species and x not in ['Anthochaera phrygia','Neophema chrysogaster','Pardalotus quadragintus','Numenius madagascariensis','Calidris ferruginea']]
    for m in range(1,13):
        md=raw(f'month-2024-{m:02}')
        n=md['totalRecords']
        days=calendar.monthrange(2024,m)[1]
        monthly.append({'month':m,'label':MONTHS[m-1],'season':SEASONS[m],'count':n,'daily':round(n/days,3),'days':days})
        for state,count in facet(md,'state').items():
            state_month.append({'state':state,'code':CODES[state],'month':m,'label':MONTHS[m-1],
                                'season':SEASONS[m],'count':count,'dailyIndex':round((count/days)/(state_counts[state]/366),5)})
        sm=facet(md,'species')
        ranks={s:i+1 for i,s in enumerate(sorted(sm,key=lambda s:(-sm[s],s)))}
        for s in selected:
            count=sm.get(s,0)
            species_month.append({'scientific':s,'name':common[s],'month':m,'label':MONTHS[m-1],
                                   'season':SEASONS[m],'count':count,'rank':ranks.get(s),
                                   'per10k':round(count/n*10000,5),
                                   'relative':round((count/n)/(species[s]/total),5),
                                   'topSeven':s in top})
    assert sum(x['count'] for x in monthly)==total
    assert sum(x['count'] for x in state_month)==total
    save('monthly',monthly)
    save('state-month',state_month)
    save('species-month',species_month)
    save('rankings',[x for x in species_month if x['topSeven']])
    save('species',[{'scientific':s,'name':common.get(s,s),'count':n} for s,n in sorted(species.items(),key=lambda t:-t[1])])

    # The flows represent source composition, never physical movements of birds.
    flows=[]
    for uid,label in PROVIDERS.items():
        sd=raw(f'coverage-2024-{uid}')
        for s,n in facet(sd,'state').items():
            flows.append({'source':label,'state':s,'code':CODES[s],'count':n})
    assert sum(x['count'] for x in flows)==total
    save('flows',flows)
    fam_sorted=sorted(families,key=families.get,reverse=True)
    family_rows=[{'family':s,'count':families[s],'share':families[s]/total} for s in fam_sorted[:15]]
    family_rows.append({'family':'Other families / unassigned','count':sum(families[s] for s in fam_sorted[15:]),'share':sum(families[s] for s in fam_sorted[15:])/total})
    save('families',family_rows)

    bee_grid=defaultdict(int)
    bee_ridges=[]
    bee_month=[]
    for m in range(1,13):
        bd=raw(f'bee-eater-2024-{m:02}')
        n=bd['totalRecords']
        latitude=Counter()
        for cell,count in facet(bd,'point-1').items():
            lat,lon=map(float,cell.split(','))
            latitude[lat]+=count
            bee_grid[(SEASONS[m],lat,lon)]+=count
        assert sum(latitude.values())==n
        median=weighted_median(list(latitude.items()))
        south=sum(count for lat,count in latitude.items() if lat<=-30)
        bee_month.append({'month':m,'label':MONTHS[m-1],'season':SEASONS[m],'count':n,'medianLatitude':median,'southOf30':south,'southShare':south/n})
        for lat in range(-44,-9):
            bee_ridges.append({'month':m,'label':MONTHS[m-1],'season':SEASONS[m],'latitude':lat,'count':latitude[lat],'share':latitude[lat]/n})
    save('bee-ridges',bee_ridges)
    save('bee-month',bee_month)
    save('bee-map',[{'season':season,'latitude':lat,'longitude':lon,'count':n} for (season,lat,lon),n in bee_grid.items()])

    # Listings include species and subspecies. Do not collapse listed subspecies into their parent.
    rows=list(csv.DictReader((RAW/'threatened-species.csv').read_text(encoding='utf-8-sig').splitlines()))
    birds=[r for r in rows if r['Class']=='Aves']
    threatened=[r for r in birds if r['Threatened status'] in STATUS and any(r[CODES[s]]=='Yes' for s in STATES)]
    listings=[]
    for r in threatened:
        listings.append({'scientific':r['Scientific Name'],'name':r['Common Name'],
                         'status':r['Threatened status'],'states':[CODES[s] for s in STATES if r[CODES[s]]=='Yes'],
                         'infraspecies':r['Infraspecies'],'profile':r['Profile']})
    save('threatened-listings',listings)
    swarm=[]
    unmatched=[]
    for r in threatened:
        s=r['Scientific Name']
        if r['Infraspecies']!='-' or len(s.split())!=2:
            continue
        if s not in species:
            unmatched.append(s)
            continue
        swarm.append({'scientific':s,'name':r['Common Name'].split(',')[0],
                      'status':r['Threatened status'],'count':species[s],'profile':r['Profile']})
    save('threatened-records',swarm)
    combinations=Counter(tuple(r['states']) for r in listings)
    upset=[]
    for i,(states,n) in enumerate(sorted(combinations.items(),key=lambda t:(-t[1],t[0]))[:12]):
        upset.append({'id':i,'states':list(states),'combination':' + '.join(states),'count':n})
    save('upset',upset)

    coverage=[]
    for year in [2024,2025,2026]:
        for uid,label in PROVIDERS.items():
            cd=raw(f'coverage-{year}-{uid}')
            counts=facet(cd,'month')
            peak=max(counts.values(),default=0)
            for m in range(1,13):
                # Newest view ends with the last completed month; September is in progress.
                included=year<2026 or m<=8
                n=counts.get(calendar.month_name[m],0) if included else None
                coverage.append({'year':year,'source':label,'row':label+' · '+str(year),
                                  'month':m,'label':MONTHS[m-1],'count':n,
                                  'relative':round(n/peak,5) if n and peak else None,
                                  'availability':'Outside comparison' if not included else ('Recorded' if n else 'No records in snapshot')})
    save('coverage',coverage)

    i24=facet(raw('inat-species-2024'),'species')
    i25=facet(raw('inat-species-2025'),'species')
    t24=raw('inat-species-2024')['totalRecords']; t25=raw('inat-species-2025')['totalRecords']
    recent=[]
    for s in common:
        # Every featured bird with at least 500 iNaturalist records in 2024. No further
        # selection, so the chart cannot favour the birds that happened to move most.
        if i24.get(s,0)>=500 and s in i25:
            a=i24[s]/t24*10000;b=i25[s]/t25*10000
            recent.append({'scientific':s,'name':common[s],'count2024':i24[s],'count2025':i25[s],
                           'rate2024':round(a,4),'rate2025':round(b,4),'difference':round(b-a,4),
                           'pct':round(100*(b-a)/a,2)})
    save('recent',sorted(recent,key=lambda r:-r['pct']))

    def season_stats(season):
        a=[r for r in bee_month if r['season']==season]
        return sum(r['southOf30'] for r in a)/sum(r['count'] for r in a)
    east=sum(state_counts[s] for s in ['New South Wales','Victoria','Queensland'])/total
    peak=max(monthly,key=lambda x:x['daily'])
    insights={'total':total,'species':len(species),'speciesUnassigned':facet(d,'species',True).get('Not supplied',0),
              'eastShare':east,'topGridShare':max(r['count'] for r in grid)/total,
              'ebirdShare':raw('coverage-2024-dr2009')['totalRecords']/total,
              'peakMonth':peak['label'],'peakDaily':peak['daily'],'gridCells':len(grid),
              'beeSummerSouth':season_stats('Summer'),'beeWinterSouth':season_stats('Winter'),
              'beeTotal':sum(r['count'] for r in bee_month),'listedTaxa':len(listings),'matchedThreatenedSpecies':len(swarm),
              'unmatchedThreatenedSpecies':unmatched,'upsetShown':sum(r['count'] for r in upset),
              'upsetCombinations':len(combinations),'inat2024':t24,'inat2025':t25,'retrieved':'10 September 2026'}
    maps()
    insights.update(map_extras(state_rows,listings,swarm,grid,total))
    save('insights',insights)
    print(json.dumps(insights,indent=2))
    print('All aggregation checks passed. Downloaded facet totals reconcile.')

def ring_area(ring):
    return sum(ring[i][0]*ring[i+1][1]-ring[i+1][0]*ring[i][1] for i in range(len(ring)-1))/2

def inside(point, features):
    """Even-odd ray cast against every ring of the state boundaries."""
    x,y=point; hit=False
    for f in features:
        g=f['geometry']
        for poly in (g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]):
            for ring in poly:
                for (x1,y1),(x2,y2) in zip(ring,ring[1:]):
                    if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1:
                        hit=not hit
    return hit

def season_field(summer, winter, land, floor):
    """Smoothed winter-versus-summer lean on a 0.25-degree lattice, contoured into bands.

    Each season's 1-degree counts are spread with a Gaussian kernel (sigma 1 degree), then
    turned into shares of that season's national total. The value is log2(winter share /
    summer share): +1 means a place holds twice as large a share of winter records as of
    summer records. Cells with too little smoothed evidence, or off the mainland and
    Tasmania, are left empty rather than guessed.
    """
    import numpy as np
    import contourpy
    lons=np.arange(112,154.001,.25); lats=np.arange(-44,-9.999,.25)
    X,Y=np.meshgrid(lons,lats)
    def smooth(counts):
        z=np.zeros_like(X)
        for cell,n in counts.items():
            la,lo=map(float,cell.split(','))
            z+=n*np.exp(-((X-lo)**2+(Y-la)**2)/2)
        return z
    s,w=smooth(summer),smooth(winter)
    ts,tw=sum(summer.values()),sum(winter.values())
    evidence=(s+w)
    with np.errstate(divide='ignore',invalid='ignore'):
        z=np.log2((w/tw)/(s/ts))
    z=np.clip(z,-3,3)
    z[(evidence<floor)|~land]=np.nan
    levels=[-3.01,-1,-.4,.4,1,3.01]
    names=['Much busier in summer','Busier in summer','About even','Busier in winter','Much busier in winter']
    gen=contourpy.contour_generator(X,Y,np.ma.masked_invalid(z),fill_type='OuterOffset')
    features=[]
    for i in range(5):
        points,offsets=gen.filled(levels[i],levels[i+1])
        polys=[]
        for pts,off in zip(points,offsets):
            rings=[[[round(float(a),3),round(float(b),3)] for a,b in pts[off[k]:off[k+1]]] for k in range(len(off)-1)]
            # d3-geo reads a clockwise exterior (negative area with latitude up) as the
            # polygon itself; the other winding would fill the rest of the globe.
            rings=[r if (ring_area(r)<0)==(k==0) else r[::-1] for k,r in enumerate(rings)]
            polys.append(rings)
        if polys:
            features.append({'type':'Feature','properties':{'band':i,'label':names[i]},
                             'geometry':{'type':'MultiPolygon','coordinates':polys}})
    return features

def map_extras(state_rows, listings, swarm, grid, total):
    import numpy as np
    out={}
    # ABS population is a second denominator for the choropleth: land area asks where
    # the notebook is dense, residents ask how many records each local person implies.
    pop={r['Region']:int(r['OBS_VALUE']) for r in csv.DictReader((RAW/'abs-erp-2024q2.csv').read_text(encoding='utf-8-sig').splitlines())}
    listed=Counter(c for r in listings for c in r['states'])
    for s in state_rows:
        s['population']=pop[s['state']]
        s['perResident']=round(s['count']/pop[s['state']]*1000,3)
        s['listed']=listed[s['code']]
    save('states',state_rows)
    out['ntPerResident']=next(s['perResident'] for s in state_rows if s['code']=='NT')
    out['actPerResident']=next(s['perResident'] for s in state_rows if s['code']=='ACT')

    # Threatened-bird records per 1,000 records, per one-degree cell.
    rows=list(csv.DictReader((RAW/'threatened-species.csv').read_text(encoding='utf-8-sig').splitlines()))
    family={r['Scientific Name']:r['Family'] for r in rows if r['Infraspecies']=='-'}
    sea={'Diomedeidae','Procellariidae'}; shore={'Scolopacidae','Charadriidae','Rostratulidae','Laridae','Ardeidae'}
    group=lambda s:'Seabirds' if family.get(s) in sea else 'Shorebirds & wetland birds' if family.get(s) in shore else 'Land birds'
    all_cells={r['cell']:r['count'] for r in grid}
    cells=defaultdict(lambda:{'Seabirds':0,'Shorebirds & wetland birds':0,'Land birds':0,'top':Counter(),'topBy':defaultdict(Counter)})
    for r in swarm:
        for cell,n in facet(raw('threat-'+r['scientific'].replace(' ','-')),'point-1').items():
            g=group(r['scientific'])
            cells[cell][g]+=n; cells[cell]['top'][r['name']]+=n; cells[cell]['topBy'][g][r['name']]+=n
    spikes=[]
    for cell,c in cells.items():
        n=all_cells.get(cell,0)
        if n<300:
            continue  # a rate from a few hundred records or fewer is too unstable to plot
        lat,lon=map(float,cell.split(','))
        for g in ['Seabirds','Shorebirds & wetland birds','Land birds']:
            if c[g]:
                spikes.append({'latitude':lat,'longitude':lon,'group':g,'threatened':c[g],'records':n,
                               'per1000':round(1000*c[g]/n,2),
                               # The most recorded threatened bird within this kind, and overall.
                               'top':c['topBy'][g].most_common(1)[0][0],'topAll':c['top'].most_common(1)[0][0]})
    save('threatened-grid',spikes)
    threat_total=sum(r['count'] for r in swarm)
    for key,g in [('seaShare','Seabirds'),('shoreShare','Shorebirds & wetland birds'),('landShare','Land birds')]:
        out[key]=sum(c[g] for c in cells.values())/threat_total

    # Winter-versus-summer lean, for all records and for the bee-eater.
    summer,winter,bsummer,bwinter=Counter(),Counter(),Counter(),Counter()
    for m in [12,1,2,6,7,8]:
        a,b=(summer,bsummer) if m in (12,1,2) else (winter,bwinter)
        a.update(facet(raw(f'month-2024-{m:02}'),'point-1'))
        b.update(facet(raw(f'bee-eater-2024-{m:02}'),'point-1'))
    aus=json.loads((OUT/'australia.json').read_text(encoding='utf-8'))['features']
    lons=np.arange(112,154.001,.25); lats=np.arange(-44,-9.999,.25)
    land=np.array([[inside((lo,la),aus) for lo in lons] for la in lats])
    field=[]
    for who,(s,w,floor) in {'Everyone':(summer,winter,400),'Bee-eater':(bsummer,bwinter,12)}.items():
        for f in season_field(s,w,land,floor):
            f['properties']['who']=who; field.append(f)
    save('season-field',{'type':'FeatureCollection','features':field})
    south=lambda C:sum(n for c,n in C.items() if float(c.split(',')[0])<=-30)/sum(C.values())
    out.update({'allSummerSouth':south(summer),'allWinterSouth':south(winter)})
    return out

if __name__=='__main__':
    main()
