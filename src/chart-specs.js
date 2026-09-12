// Original, data-driven Vega and Vega-Lite specifications for the field journal.
// Also used by the browser: the published JSONs and live figures share one source.
export const C = {
  ink: '#292e27', muted: '#60665c', rule: '#d5d0c1', paper: '#f8f5ec',
  green: '#315e4c', lightGreen: '#d6dfcd', ochre: '#ad7926', rust: '#a74735',
  seasons: ['#b0782c', '#98523e', '#557784', '#58723e'],
  birds: ['#315e4c', '#b26931', '#456e94', '#8c4b67', '#777129', '#594f88', '#a84436'],
};
const FONT = 'Bricolage Grotesque';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SEASONS = ['Summer','Autumn','Winter','Spring'];
const projection = {type:'conicEqualArea', parallels:[-18,-36], rotate:[-134,0,0], center:[0,-28]};
const lightRamp = ['#e9e4d6','#bacdb5','#7caa8d','#477c62','#204c3b'];
const config = {
  background:'transparent', font:FONT,
  view:{stroke:null},
  axis:{labelFont:FONT,titleFont:FONT,labelFontSize:12,titleFontSize:12,titleFontWeight:500,
    labelColor:C.muted,titleColor:C.ink,domain:false,ticks:false,gridColor:'#e0dccf',gridOpacity:.75,labelPadding:8,titlePadding:14},
  legend:{labelFont:FONT,titleFont:FONT,labelFontSize:11,titleFontSize:11,titleFontWeight:500,
    labelColor:C.muted,titleColor:C.ink,gradientThickness:9,gradientLength:130,padding:8},
  title:{font:FONT,color:C.ink,fontSize:15,fontWeight:500,anchor:'start'},
};
const VL = (width,height,body) => ({$schema:'https://vega.github.io/schema/vega-lite/v5.json',
  width:Math.max(180,Math.round(width)),height:Math.round(height),padding:8,config,...body});
const V = (width,height,body) => ({$schema:'https://vega.github.io/schema/vega/v5.json',
  width:Math.max(220,Math.round(width)),height:Math.round(height),padding:8,background:'transparent',
  autosize:{type:'pad',contains:'padding'},config:{text:{font:FONT,fill:C.ink},axis:config.axis,legend:config.legend},...body});
const tooltip = (field,title,format) => ({field,title,...(format?{format}:{})});
const stateData = D => D.australia.features.map(f=>({...f,...D.states.find(s=>s.code===f.properties.code)}));
const baseMap = D => ({data:{values:D.australia.features},mark:{type:'geoshape',fill:'#e8e4d9',stroke:'#c7c6b8',strokeWidth:.7}});
const mapH = w => Math.min(520, Math.max(270,w*.7));

function gridMap(D,w) {
  const cells=D.grid.map(r=>({type:'Feature',properties:r,geometry:{type:'Polygon',coordinates:[[
    [r.longitude-.5,r.latitude-.5],[r.longitude-.5,r.latitude+.5],
    [r.longitude+.5,r.latitude+.5],[r.longitude+.5,r.latitude-.5],[r.longitude-.5,r.latitude-.5],
  ]]}}));
  return VL(w-16,mapH(w),{description:'2024 observation records grouped by rounded one-degree coordinates. Equal angular cells are not equal-area population estimates.',
    projection,layer:[baseMap(D),{
      data:{values:cells},mark:{type:'geoshape',stroke:C.paper,strokeWidth:.45},
      encoding:{color:{field:'properties.count',type:'quantitative',scale:{type:'log',domain:[1,1200000],range:lightRamp},
        legend:{title:'Records in 1° cell',orient:'bottom',values:[1,100,10000,1000000],format:'.0s',gradientLength:220}},
        tooltip:[tooltip('properties.count','2024 records',','),tooltip('properties.latitude','Rounded latitude'),tooltip('properties.longitude','Rounded longitude')]},
    },{data:{values:D.australia.features},mark:{type:'geoshape',fill:null,stroke:'#9b9d8d',strokeWidth:.55}},
    {data:{values:[{name:'Perth',longitude:115.86,latitude:-31.95},{name:'Melbourne',longitude:144.96,latitude:-37.81},
      {name:'Sydney',longitude:151.21,latitude:-33.87},{name:'Brisbane',longitude:153.03,latitude:-27.47}]},
      mark:{type:'text',fontSize:11,fontWeight:600,dy:14,stroke:C.paper,strokeWidth:3},
      encoding:{longitude:{field:'longitude',type:'quantitative'},latitude:{field:'latitude',type:'quantitative'},text:{field:'name'}}},
    {data:{values:[{name:'Perth',longitude:115.86,latitude:-31.95},{name:'Melbourne',longitude:144.96,latitude:-37.81},
      {name:'Sydney',longitude:151.21,latitude:-33.87},{name:'Brisbane',longitude:153.03,latitude:-27.47}]},
      mark:{type:'text',fontSize:11,fontWeight:600,dy:14,color:C.ink},
      encoding:{longitude:{field:'longitude',type:'quantitative'},latitude:{field:'latitude',type:'quantitative'},text:{field:'name'}}},
    ]});
}

function densityMap(D,w) {
  return VL(w-16,mapH(w),{description:'State-level observation-record density, using Geoscience Australia land areas. Not bird density.',projection,
    layer:[{data:{values:stateData(D)},mark:{type:'geoshape',stroke:C.paper,strokeWidth:1.3},encoding:{
      color:{field:'density',type:'quantitative',scale:{type:'log',domain:[200,150000],range:lightRamp},
        legend:{title:'Records / 1,000 km²',orient:'bottom',values:[300,3000,30000,150000],format:'.0s',gradientLength:210}},
      tooltip:[tooltip('state','State / territory'),tooltip('count','2024 records',','),tooltip('density','Records / 1,000 km²',',.0f'),tooltip('area','Land area (km²)',',')],
    }},{data:{values:D.states.filter(d=>d.code!=='ACT')},mark:{type:'text',fontSize:12,fontWeight:600},encoding:{
      longitude:{field:'longitude',type:'quantitative'},latitude:{field:'latitude',type:'quantitative'},text:{field:'code'},
      color:{condition:{test:'datum.density > 5000',value:C.paper},value:C.ink},
    }}]});
}

function alluvial(D,w) {
  const narrow=w<600, width=w-16, H=narrow?440:400;
  const left=narrow?108:150, right=narrow?width-74:width-144;
  const sourceNames=['eBird Australia','BirdLife Australia, Birdata','iNaturalist Australia'];
  const sourceShort={'eBird Australia':'eBird','BirdLife Australia, Birdata':'Birdata','iNaturalist Australia':'iNaturalist'};
  const states=[...D.states].sort((a,b)=>b.count-a.count);
  const total=D.insights.total, unit=(H-112)/total;
  let cursor=32;const ends={}; const nodes=[];
  for (const s of states) {ends[s.state]={y:cursor,offset:cursor};nodes.push({side:'right',name:s.code,label:s.state,count:s.count,y0:cursor,y1:cursor+s.count*unit});cursor+=s.count*unit+11;}
  cursor=32+(7*11-2*24)/2;
  const starts={};
  for (const source of sourceNames){const n=D.flows.filter(f=>f.source===source).reduce((a,b)=>a+b.count,0);
    starts[source]={y:cursor,offset:cursor};nodes.push({side:'left',name:sourceShort[source],label:source,count:n,y0:cursor,y1:cursor+n*unit,source});cursor+=n*unit+24;}
  const links=[];
  for (const source of sourceNames) for (const s of states) {
    const f=D.flows.find(f=>f.source===source&&f.state===s.state);if(!f)continue;
    const sy0=starts[source].offset,ty0=ends[s.state].offset,delta=f.count*unit;
    starts[source].offset+=delta;ends[s.state].offset+=delta;
    const mid=(left+right)/2;
    links.push({...f,path:`M${left},${sy0}C${mid},${sy0} ${mid},${ty0} ${right},${ty0}L${right},${ty0+delta}C${mid},${ty0+delta} ${mid},${sy0+delta} ${left},${sy0+delta}Z`});
  }
  return V(width,H,{description:'An alluvial diagram showing how records from three citizen-science datasets are distributed across states. Ribbon thickness is proportional to record count. These are not migration paths.',
    data:[{name:'links',values:links},{name:'nodes',values:nodes}],
    scales:[{name:'source',type:'ordinal',domain:sourceNames,range:[C.green,C.ochre,'#627c90']}],
    marks:[{type:'path',from:{data:'links'},encode:{enter:{path:{field:'path'},fill:{scale:'source',field:'source'},fillOpacity:{value:.42},
      tooltip:{signal:"{'Dataset':datum.source,'State':datum.state,'Records':format(datum.count,',')}"}},update:{fillOpacity:{value:.42}},hover:{fillOpacity:{value:.85}}}},
      {type:'rect',from:{data:'nodes'},encode:{enter:{x:{signal:`datum.side==='left'?${left-6}:${right}`},width:{value:6},y:{field:'y0'},y2:{field:'y1'},
        fill:{signal:`datum.side==='left'?scale('source',datum.source):'${C.ink}'`},tooltip:{signal:"{'Name':datum.label,'Records':format(datum.count,',')}"}}}},
      {type:'text',from:{data:'nodes'},encode:{enter:{x:{signal:`datum.side==='left'?${left-14}:${right+13}`},y:{signal:'(datum.y0+datum.y1)/2-6'},
        text:{field:'name'},align:{signal:"datum.side==='left'?'right':'left'"},fontSize:{value:narrow?12:14},fontWeight:{value:500}}}},
      {type:'text',from:{data:'nodes'},encode:{enter:{x:{signal:`datum.side==='left'?${left-14}:${right+13}`},y:{signal:'(datum.y0+datum.y1)/2+11'},
        text:{signal:"format(datum.count/"+total+",'.1%')"},align:{signal:"datum.side==='left'?'right':'left'"},fontSize:{value:11},fill:{value:C.muted}}}},
    ]});
}

function treemap(D,w) {
  const width=w-16,H=w<600?430:380;
  const friendly={'Meliphagidae':'Honeyeaters','Artamidae':'Magpies & allies','Psittacidae':'Parrots','Anatidae':'Ducks & allies',
    'Columbidae':'Pigeons & doves','Cacatuidae':'Cockatoos','Acanthizidae':'Thornbills & allies','Rhipiduridae':'Fantails',
    'Maluridae':'Fairy-wrens','Hirundinidae':'Swallows','Campephagidae':'Cuckoo-shrikes','Corvidae':'Crows & ravens',
    'Charadriidae':'Plovers','Pachycephalidae':'Whistlers & allies','Scolopacidae':'Sandpipers & allies'};
  const vals=[{id:'root',parent:null,count:0},...D.families.map((r,i)=>({...r,id:r.family,parent:'root',label:friendly[r.family]||r.family,rank:i}))];
  return V(width,H,{description:'Treemap of the fifteen most-recorded bird families and the remainder. Rectangle area encodes records, not species richness.',
    data:[{name:'tree',values:vals,transform:[{type:'stratify',key:'id',parentKey:'parent'},
      {type:'treemap',field:'count',sort:{field:'value',order:'descending'},method:'squarify',ratio:1.35,size:[width,H],paddingInner:4}]},
      {name:'leaves',source:'tree',transform:[{type:'filter',expr:'datum.depth===1'}]}],
    scales:[{name:'fill',type:'ordinal',domain:Array.from({length:16},(_,i)=>i),range:['#315e4c','#856125','#536a48','#4b6974','#775238','#5b714d','#526b58','#716347','#315e4c','#856125','#536a48','#4b6974','#775238','#5b714d','#526b58','#ded8c7']}],
    marks:[{type:'rect',from:{data:'leaves'},encode:{enter:{x:{field:'x0'},x2:{field:'x1'},y:{field:'y0'},y2:{field:'y1'},
      fill:{scale:'fill',field:'rank'},fillOpacity:{value:.94},tooltip:{signal:"{'Family':datum.family,'Records':format(datum.count,','),'Share':format(datum.share,'.1%')}"}},
      update:{fillOpacity:{value:.94}},hover:{fillOpacity:{value:1},stroke:{value:C.ink},strokeWidth:{value:1.5}}}},
      {type:'text',from:{data:'leaves'},encode:{enter:{x:{signal:'datum.x0+12'},y:{signal:'datum.y0+22'},text:{field:'label'},
        fill:{signal:"datum.rank===15?'#292e27':'#fffdf5'"},fontSize:{value:w<500?11:13},fontWeight:{value:500},limit:{signal:'datum.x1-datum.x0-22'},
        opacity:{signal:'datum.x1-datum.x0>70 && datum.y1-datum.y0>48?1:0'}}}},
      {type:'text',from:{data:'leaves'},encode:{enter:{x:{signal:'datum.x0+12'},y:{signal:'datum.y0+42'},text:{signal:"format(datum.share,'.1%')"},
        fill:{signal:"datum.rank===15?'#292e27':'#fffdf5'"},fontSize:{value:12},opacity:{signal:'datum.x1-datum.x0>65 && datum.y1-datum.y0>53?1:0'}}}},
    ]});
}

function seasonalClock(D,w) {
  const width=w-16, radius=Math.min(234,(width-72)/2), H=radius*2+100, cx=width/2,cy=H/2;
  const codes=['NT','QLD','WA','SA','NSW','ACT','VIC','TAS'];
  const inner=38,band=(radius-inner)/8, gap=.64,step=(Math.PI*2-gap)/12;
  const vals=D.stateMonth.map(r=>({...r,a0:gap/2+(r.month-1)*step+.012,a1:gap/2+r.month*step-.012,
    r0:inner+codes.indexOf(r.code)*band+1,r1:inner+(codes.indexOf(r.code)+1)*band-1}));
  const labels=MONTHS.map((label,i)=>({label,angle:gap/2+(i+.5)*step}));
  return V(width,H,{description:'Circular heatmap of monthly records per day relative to each state’s annual daily average. Rings show states from north to south; sectors follow the calendar.',
    data:[{name:'cells',values:vals},{name:'months',values:labels},
      {name:'rings',values:codes.map((code,i)=>({code,r:inner+(i+.5)*band}))}],
    scales:[{name:'pace',type:'linear',domain:[.5,1,1.6],range:['#c3a26d','#eee9dc',C.green],clamp:true}],
    marks:[{type:'arc',from:{data:'cells'},encode:{enter:{x:{value:cx},y:{value:cy},startAngle:{field:'a0'},endAngle:{field:'a1'},innerRadius:{field:'r0'},outerRadius:{field:'r1'},
      fill:{scale:'pace',field:'dailyIndex'},tooltip:{signal:"{'State':datum.state,'Month':datum.label,'Records':format(datum.count,','),'Daily pace vs state average':format(datum.dailyIndex,'.2f')+'×'}"}},
      update:{strokeWidth:{value:0}},hover:{stroke:{value:C.ink},strokeWidth:{value:1.4}}}},
      {type:'text',from:{data:'months'},encode:{enter:{x:{signal:`${cx}+sin(datum.angle)*${radius+24}`},y:{signal:`${cy}-cos(datum.angle)*${radius+24}`},
        text:{field:'label'},align:{value:'center'},baseline:{value:'middle'},fontSize:{value:12}}}},
      {type:'text',from:{data:'rings'},encode:{enter:{x:{value:cx},y:{signal:`${cy}-datum.r`},text:{field:'code'},align:{value:'center'},baseline:{value:'middle'},fontSize:{value:w<450?9:11},fill:{value:C.muted}}}},
      {type:'text',encode:{enter:{x:{value:cx},y:{value:cy-3},text:{value:'2024'},align:{value:'center'},fontSize:{value:17},fontWeight:{value:500}}}},
      {type:'text',encode:{enter:{x:{value:cx},y:{value:cy+14},text:{value:'daily pace'},align:{value:'center'},fontSize:{value:9},fill:{value:C.muted}}}},
    ],legends:[{fill:'pace',type:'gradient',orient:'bottom',title:'Compared with each state’s daily average',values:[.5,1,1.6],format:'.1f',gradientLength:200}]});
}

function bump(D,w) {
  const compact=w<680,names=[...new Set(D.rankings.map(r=>r.name))];
  const end=D.rankings.filter(r=>r.month===12),max=Math.max(...D.rankings.map(r=>r.rank));
  const width=w-(compact?42:190);
  return VL(width,350,{description:'Monthly ranks for the seven species with the most annual records. Rank is among all named species recorded in that month.',
    params:[{name:'highlight',value:'All birds'}],
    data:{values:D.rankings},encoding:{x:{field:'month',type:'ordinal',sort:'ascending',axis:{title:null,labelAngle:0,labelExpr:"['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][datum.value-1]"}},
      y:{field:'rank',type:'quantitative',scale:{domain:[1,max],reverse:true,zero:false},axis:{title:'Most recorded → lower rank',tickCount:Math.min(max,10),format:'d'}},
      color:{field:'name',type:'nominal',scale:{domain:names,range:C.birds},legend:compact?{title:null,orient:'bottom',columns:2,labelLimit:150}:null},
      opacity:{condition:{test:"highlight==='All birds'||datum.name===highlight",value:1},value:.13}},
    layer:[{mark:{type:'line',strokeWidth:2.7,interpolate:'monotone'},encoding:{detail:{field:'name'}}},
      {mark:{type:'point',filled:true,size:58,stroke:C.paper,strokeWidth:1.2},encoding:{tooltip:[tooltip('name','Bird'),tooltip('label','Month'),tooltip('rank','Rank'),tooltip('count','Records',',')]}},
      ...(!compact?[{data:{values:end},mark:{type:'text',align:'left',dx:13,fontSize:11,fontWeight:500},encoding:{text:{field:'name'}}}]:[])],
  });
}

function beeMap(D,w) {
  const max=Math.max(...D.beeMap.map(r=>r.count));
  return VL(w-16,mapH(w),{description:'Proportional-symbol map of rainbow bee-eater records aggregated to rounded one-degree locations, selectable by season. Bubble area, not radius, represents count. The size scale stays fixed between seasons.',
    params:[{name:'season',value:'Summer'}],projection,layer:[baseMap(D),
      {data:{values:D.beeMap},transform:[{filter:'datum.season===season'}],mark:{type:'circle',opacity:.68,stroke:C.paper,strokeWidth:.6},encoding:{
        longitude:{field:'longitude',type:'quantitative'},latitude:{field:'latitude',type:'quantitative'},
        size:{field:'count',type:'quantitative',scale:{domain:[0,max],range:[0,w<500?450:700]},legend:{title:'Bee-eater records',orient:'bottom',values:[100,500,1000],symbolFillColor:C.ochre}},
        color:{field:'season',type:'nominal',scale:{domain:SEASONS,range:C.seasons},legend:null},
        tooltip:[tooltip('season','Season'),tooltip('count','Bee-eater records',','),tooltip('latitude','Rounded latitude'),tooltip('longitude','Rounded longitude')],
      }},
      {data:{values:[{longitude:112,latitude:-30},{longitude:154,latitude:-30}]},mark:{type:'line',strokeDash:[4,5],color:C.muted,strokeWidth:1},
        encoding:{longitude:{field:'longitude',type:'quantitative'},latitude:{field:'latitude',type:'quantitative'}}},
      {data:{values:[{longitude:115,latitude:-30,name:'30°S'}]},mark:{type:'text',dy:-10,color:C.muted,fontSize:11},
        encoding:{longitude:{field:'longitude',type:'quantitative'},latitude:{field:'latitude',type:'quantitative'},text:{field:'name'}}},
    ]});
}

function ridgeline(D,w) {
  const width=w-64,H=450,step=32, baseline=22;
  const data=D.beeRidges.map(r=>({...r,south:Math.abs(r.latitude)}));
  return V(width,H,{description:'Monthly latitude distributions of rainbow bee-eater records. Each ridge is normalised to that month’s bee-eater records, at one-degree latitude bins. Peaks show where records concentrate, not a bird’s flight path.',
    padding:{left:46,right:10,top:16,bottom:40},
    data:[{name:'ridges',values:data},{name:'months',values:D.beeMonth}],
    scales:[{name:'x',type:'linear',domain:[-44,-10],range:'width',nice:false,zero:false},
      {name:'season',type:'ordinal',domain:SEASONS,range:C.seasons}],
    axes:[{orient:'bottom',scale:'x',values:[-40,-35,-30,-25,-20,-15,-10],title:'← Southern Australia                  Northern Australia →',
      encode:{labels:{update:{text:{signal:"abs(datum.value)+'°S'"}}}}}],
    marks:[{type:'rule',encode:{enter:{x:{scale:'x',value:-30},y:{value:0},y2:{value:H-20},stroke:{value:C.muted},strokeDash:{value:[3,5]},strokeOpacity:{value:.5}}}},
      {type:'group',from:{facet:{name:'series',data:'ridges',groupby:['month','season']}},
        encode:{enter:{y:{signal:`(datum.month-1)*${step}+${baseline}`},height:{value:step},width:{signal:'width'}}},
        marks:[{type:'rule',encode:{enter:{x:{value:0},x2:{signal:'width'},y:{value:step},stroke:{value:C.rule},strokeWidth:{value:.6}}}},
          {type:'area',from:{data:'series'},sort:{field:'datum.latitude'},encode:{enter:{x:{scale:'x',field:'latitude'},y:{signal:`${step}-datum.share*${step*3.1}`},y2:{value:step},
            fill:{scale:'season',field:'season'},fillOpacity:{value:.48},stroke:{scale:'season',field:'season'},strokeWidth:{value:1.25},interpolate:{value:'monotone'}}}},
          {type:'symbol',from:{data:'series'},encode:{enter:{x:{scale:'x',field:'latitude'},y:{signal:`${step}-datum.share*${step*3.1}`},size:{value:90},fill:{value:'transparent'},
            tooltip:{signal:"{'Month':datum.label,'Latitude':abs(datum.latitude)+'°S','Bee-eater records':format(datum.count,','),'Share of month':format(datum.share,'.1%')}"}}}},
        ]},
      {type:'text',from:{data:'months'},encode:{enter:{x:{value:-10},y:{signal:`(datum.month-1)*${step}+${baseline+step-3}`},text:{field:'label'},align:{value:'right'},fontSize:{value:12}}}},
    ]});
}

function seasonMatrix(D,w) {
  const names=['Rainbow Bee-eater','White-throated Needletail','Eastern Koel','Red-necked Stint','Welcome Swallow','Silvereye','Superb Fairy-wren','Australian Magpie'];
  const width=w-(w<500?138:195);
  return VL(width,320,{description:'Monthly share of all records for eight featured species, divided by each species’ annual share. One means the species occupies its typical share. This adjusts for total monthly record volume, not survey effort.',
    data:{values:D.speciesMonth.filter(r=>names.includes(r.name))},mark:{type:'rect',stroke:C.paper,strokeWidth:2,cornerRadius:1},
    encoding:{x:{field:'label',type:'ordinal',sort:MONTHS,axis:{title:null,labelAngle:0}},
      y:{field:'name',type:'ordinal',sort:names,axis:{title:null,labelLimit:w<500?120:180,labelFontSize:w<500?10:12}},
      color:{field:'relative',type:'quantitative',scale:{type:'log',domain:[.25,1,4],range:['#b18a55','#efeadd',C.green],clamp:true},
        legend:{title:'Share relative to annual share',orient:'bottom',values:[.25,1,4],format:'.2~f',gradientLength:180}},
      tooltip:[tooltip('name','Bird'),tooltip('label','Month'),tooltip('count','Records',','),tooltip('per10k','Per 10,000 bird records','.1f'),tooltip('relative','Relative to annual share','.2f')]},
  });
}

function swarm(D,w) {
  const width=w-70,H=300,statuses=['Vulnerable','Endangered','Critically Endangered'];
  const max=Math.max(...D.threatenedRecords.map(r=>r.count));
  const rows=[];
  // Deterministic collision-aware packing. Recomputed for the actual available width.
  const x=n=>(Math.log10(n)/Math.log10(15000))*width;
  for(const status of statuses){const placed=[];
    for(const r of D.threatenedRecords.filter(r=>r.status===status).sort((a,b)=>b.count-a.count)){
      const px=x(r.count);let py=0;
      const candidates=[0,...Array.from({length:10},(_,i)=>[(i+1)*10,-(i+1)*10]).flat()];
      for(const candidate of candidates){if(placed.every(p=>Math.hypot(px-p.x,candidate-p.y)>=11)){py=candidate;break;}}
      placed.push({x:px,y:py});rows.push({...r,offset:py});
    }
  }
  return V(width,H,{description:'Beeswarm showing the record counts of 65 nationally threatened, species-level birds whose scientific names match exactly between ALA and DCCEEW. Every dot is a species. Unmatched names and listed subspecies are excluded, not treated as zero.',
    padding:{left:24,right:20,top:28,bottom:50},
    data:[{name:'birds',values:rows},{name:'statuses',values:statuses.map((status,i)=>({status,y:48+i*100}))}],
    scales:[{name:'x',type:'log',domain:[1,15000],range:'width',nice:false},
      {name:'color',type:'ordinal',domain:statuses,range:['#9b812d','#b36b37',C.rust]}],
    axes:[{scale:'x',orient:'bottom',values:[1,10,100,1000,10000],format:',',title:'2024 records per species · logarithmic scale',grid:true}],
    marks:[{type:'rule',from:{data:'statuses'},encode:{enter:{x:{value:0},x2:{signal:'width'},y:{field:'y'},stroke:{value:C.rule},strokeWidth:{value:.7}}}},
      {type:'text',from:{data:'statuses'},encode:{enter:{x:{value:0},y:{signal:'datum.y-36'},text:{field:'status'},fontSize:{value:12},fontWeight:{value:500},fill:{scale:'color',field:'status'}}}},
      {type:'symbol',from:{data:'birds'},encode:{enter:{x:{scale:'x',field:'count'},y:{signal:"48+indexof(['Vulnerable','Endangered','Critically Endangered'],datum.status)*100+datum.offset"},
        size:{value:73},fill:{scale:'color',field:'status'},stroke:{value:C.paper},strokeWidth:{value:1},
        tooltip:{signal:"{'Bird':datum.name,'Scientific name':datum.scientific,'Listing in Aug 2026':datum.status,'2024 records':format(datum.count,',')}"}},
        update:{size:{value:73}},hover:{size:{value:145},stroke:{value:C.ink}}}},
    ]});
}

function upset(D,w) {
  const width=w-66,H=390,codes=['WA','NT','SA','QLD','NSW','VIC','TAS','ACT'];
  const matrix=D.upset.flatMap(c=>codes.map((code,row)=>({...c,code,row,active:c.states.includes(code)})));
  const rules=D.upset.map(c=>({...c,min:Math.min(...c.states.map(s=>codes.indexOf(s))),max:Math.max(...c.states.map(s=>codes.indexOf(s)))}));
  return V(width,H,{description:'An UpSet chart of the twelve most common exact state combinations among 150 extant threatened bird taxa listed by DCCEEW in the eight jurisdictions. A connected column is an exact combination of states, and the bar above counts listed taxa in it.',
    padding:{left:45,right:10,top:20,bottom:18},
    data:[{name:'bars',values:D.upset},{name:'matrix',values:matrix},{name:'links',values:rules},{name:'codes',values:codes.map((code,row)=>({code,row}))}],
    scales:[{name:'x',type:'band',domain:{data:'bars',field:'id'},range:'width',padding:.28},
      {name:'y',type:'linear',domain:[0,Math.max(...D.upset.map(r=>r.count))*1.2],range:[140,0],zero:true}],
    marks:[{type:'rect',from:{data:'bars'},encode:{enter:{x:{scale:'x',field:'id'},width:{scale:'x',band:1},y:{scale:'y',field:'count'},y2:{value:140},fill:{value:C.rust},
      tooltip:{signal:"{'Exactly these states':datum.combination,'Listed bird taxa':datum.count}"}}}},
      {type:'text',from:{data:'bars'},encode:{enter:{x:{scale:'x',field:'id',band:.5},y:{scale:'y',field:'count',offset:-7},text:{field:'count'},align:{value:'center'},fontSize:{value:12},fontWeight:{value:600}}}},
      {type:'rule',encode:{enter:{x:{value:0},x2:{signal:'width'},y:{value:157},stroke:{value:C.rule}}}},
      {type:'rule',from:{data:'links'},encode:{enter:{x:{scale:'x',field:'id',band:.5},y:{signal:'178+datum.min*27'},y2:{signal:'178+datum.max*27'},stroke:{value:C.ink},strokeWidth:{value:1.5}}}},
      {type:'symbol',from:{data:'matrix'},encode:{enter:{x:{scale:'x',field:'id',band:.5},y:{signal:'178+datum.row*27'},size:{value:w<500?28:54},
        fill:{signal:`datum.active?'${C.ink}':'#dedace'`},tooltip:{signal:"{'Exactly these states':datum.combination,'Listed bird taxa':datum.count,'State':datum.code,'Included':datum.active?'Yes':'No'}"}}}},
      {type:'text',from:{data:'codes'},encode:{enter:{x:{value:-12},y:{signal:'178+datum.row*27'},text:{field:'code'},align:{value:'right'},baseline:{value:'middle'},fontSize:{value:11}}}},
    ]});
}

function coverage(D,w) {
  const compact=w<650;
  const short={'eBird Australia':'eBird','BirdLife Australia, Birdata':'Birdata','iNaturalist Australia':'iNaturalist'};
  const rows=D.coverage.map(r=>({...r,row:short[r.source]+' · '+r.year,cellLabel:r.count===null?'—':r.count===0?'×':r.count>=1000?(r.count/1000).toFixed(r.count>=100000?0:1)+'k':String(r.count)}));
  const order=[...new Set(rows.map(r=>r.row))];
  return VL(w-(compact?115:145),360,{description:'Source-by-month coverage for 2024–2026. Coloured cells contain records; crosses mean no records in this archived dataset snapshot, not zero birds. Months after August 2026 are outside the comparison.',
    data:{values:rows},encoding:{x:{field:'label',type:'ordinal',sort:MONTHS,axis:{title:null,labelAngle:0,labelFontSize:compact?10:12}},
      y:{field:'row',type:'ordinal',sort:order,axis:{title:null,labelFontSize:compact?10:12,labelLimit:140}},
      tooltip:[tooltip('source','Source'),tooltip('year','Year'),tooltip('label','Month'),tooltip('availability','Coverage'),tooltip('count','Records',',')]},
    layer:[{mark:{type:'rect',stroke:C.paper,strokeWidth:3,cornerRadius:1},encoding:{color:{condition:{test:"datum.availability==='Recorded'",field:'relative',type:'quantitative',
      scale:{domain:[0,1],range:['#c9d6c2',C.green]},legend:{title:'Record volume relative to each row’s peak',orient:'bottom',gradientLength:170,values:[0,1],format:'.0%'}},value:'#e5e0d4'}}},
      {mark:{type:'text',fontSize:compact?8:10,fontWeight:500},encoding:{text:{field:compact?'availability':'cellLabel'},
        ...(compact?{text:{condition:[{test:"datum.availability==='Outside comparison'",value:'—'},{test:"datum.availability==='No records in snapshot'",value:'×'}],value:''}}:{}),
        color:{condition:{test:'datum.relative>0.58',value:C.paper},value:C.muted}}}],
  });
}

function recent(D,w) {
  const compact=w<680;
  // Paired-endpoint chart: one common quantitative scale gives an honest comparison.
  return VL(w-(compact?157:220),300,{description:'Paired-endpoint comparison of 2024 and 2025 iNaturalist record shares. The six largest absolute changes among the featured species are shown. Platform-specific record share is not population change.',
    data:{values:D.recent},encoding:{y:{field:'name',type:'ordinal',sort:{field:'difference',order:'descending'},axis:{title:null,labelLimit:compact?135:190,labelFontSize:compact?10:12}},
      x:{type:'quantitative',scale:{zero:true},axis:{title:'Records per 10,000 iNaturalist bird records',tickCount:4}}},
    layer:[{mark:{type:'rule',strokeWidth:3,color:'#b7bdac'},encoding:{x:{field:'rate2024'},x2:{field:'rate2025'}}},
      {mark:{type:'point',filled:true,fill:C.paper,stroke:C.green,strokeWidth:2,size:90},encoding:{x:{field:'rate2024'},tooltip:[tooltip('name','Bird'),tooltip('count2024','2024 records',','),tooltip('rate2024','2024 per 10,000','.1f')]}},
      {mark:{type:'point',filled:true,color:C.green,size:90},encoding:{x:{field:'rate2025'},tooltip:[tooltip('name','Bird'),tooltip('count2025','2025 records',','),tooltip('rate2025','2025 per 10,000','.1f'),tooltip('difference','Change in share (per 10,000)','+.1f')]}},
    ]});
}

export const chartBuilders = {
  'observation-atlas':gridMap,
  'record-density':densityMap,
  'record-rivers':alluvial,
  'family-canopy':treemap,
  'seasonal-clock':seasonalClock,
  'monthly-ranks':bump,
  'seasonal-footprint':beeMap,
  'latitude-ridges':ridgeline,
  'seasonal-signatures':seasonMatrix,
  'threatened-swarm':swarm,
  'shared-responsibility':upset,
  'coverage-calendar':coverage,
  'recent-shares':recent,
};

export const chartFiles = {
  'observation-atlas':'grid', 'record-density':'states', 'record-rivers':'flows',
  'family-canopy':'families', 'seasonal-clock':'state-month', 'monthly-ranks':'rankings',
  'seasonal-footprint':'bee-map', 'latitude-ridges':'bee-ridges',
  'seasonal-signatures':'species-month', 'threatened-swarm':'threatened-records',
  'shared-responsibility':'upset', 'coverage-calendar':'coverage', 'recent-shares':'recent',
};
