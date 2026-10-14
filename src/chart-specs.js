// Original, data-driven Vega and Vega-Lite specifications for the field journal.
// Also used by the browser: the published JSONs and live figures share one source.
export const C = {
  ink: '#24281f', muted: '#5d6356', rule: '#d9d1bf', paper: '#f7f2e8',
  // Green means record volume everywhere in the journal, ochre means below the
  // usual volume, and rust is reserved for conservation. Nothing else encodes a
  // hue, which is why there is no categorical species palette here any more.
  green: '#315e4c', ochre: '#ad7926', ochreText: '#875c1b', rust: '#a74735',
  // The four seasons are the one categorical scale left. No pair is red against
  // green: that is the pairing that collapses for the commonest colour blindness,
  // so autumn is a mauve rather than a rust.
  seasons: ['#b0782c', '#8c5a86', '#557784', '#58723e'],
  display: "'Fraunces', serif",
};
let FONT = "'Source Sans 3', sans-serif";
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const SEASONS = ['Summer','Autumn','Winter','Spring'];
const projection = {type:'conicEqualArea', parallels:[-18,-36], rotate:[-134,0,0], center:[0,-28]};
// Quantitative colour comes from ColorBrewer (colorbrewer2.org), as the unit's colour
// notes direct: Greens for one-directional volume, BrBG for above/below a midpoint,
// OrRd for rising extinction risk.
const CB={greens:['#edf8e9','#bae4b3','#74c476','#31a354','#006d2c'],
  brbg:['#a6611a','#dfc27d','#f5f5f5','#80cdc1','#018571'],orrd:['#ef6548','#d7301f','#990000']};
const lightRamp = CB.greens;
const config = {
  background:'transparent', font:FONT,
  view:{stroke:null},
  axis:{labelFont:FONT,titleFont:FONT,labelFontSize:12,titleFontSize:12,titleFontWeight:500,
    labelColor:C.muted,titleColor:C.ink,domain:false,ticks:false,gridColor:'#e0dccf',gridOpacity:.75,labelPadding:8,titlePadding:14},
  legend:{labelFont:FONT,titleFont:FONT,labelFontSize:11,titleFontSize:11,titleFontWeight:500,
    labelColor:C.muted,titleColor:C.ink,gradientThickness:9,gradientLength:130,padding:8},
  title:{font:FONT,color:C.ink,fontSize:15,fontWeight:500,anchor:'start'},
};
// A page can restyle the charts' type and paper to match its own design. Data colours
// are never themed: green, ochre, rust and the ramps keep one meaning on every page.
export function applyTheme(t={}){
  // Quote family names: an unquoted name such as Source Sans 3 is not a valid canvas font,
  // so Vega would measure labels in the wrong face and truncate them.
  const q=(f,fallback)=>f&&!f.includes(',')?`'${f}', ${fallback}`:f;
  t={...t,font:q(t.font,'sans-serif'),display:q(t.display,'serif')};
  if(t.font){FONT=t.font;config.font=t.font;config.title.font=t.font;
    for(const k of ['axis','legend']){config[k].labelFont=t.font;config[k].titleFont=t.font;}}
  for(const k of ['paper','ink','muted','display']) if(t[k]) C[k]=t[k];
  if(t.ink){config.axis.titleColor=t.ink;config.legend.titleColor=t.ink;config.title.color=t.ink;}
  if(t.muted){config.axis.labelColor=t.muted;config.legend.labelColor=t.muted;}
}
const VL = (width,height,body) => ({$schema:'https://vega.github.io/schema/vega-lite/v5.json',
  width:Math.max(180,Math.round(width)),height:Math.round(height),padding:8,config,...body});
const V = (width,height,body) => ({$schema:'https://vega.github.io/schema/vega/v5.json',
  width:Math.max(220,Math.round(width)),height:Math.round(height),padding:8,background:'transparent',
  autosize:{type:'pad',contains:'padding'},config:{text:{font:FONT,fill:C.ink},axis:config.axis,legend:config.legend},...body});
const tooltip = (field,title,format) => ({field,title,...(format?{format}:{})});
const stateData = D => D.australia.features.map(f=>({...f,...D.states.find(s=>s.code===f.properties.code)}));
const baseMap = D => ({data:{values:D.australia.features},mark:{type:'geoshape',fill:'#e8e4d9',stroke:'#c7c6b8',strokeWidth:.7}});
const mapH = w => Math.min(620, Math.max(270,w*.78));
// Paired charts share a height: the heatmap's rows and the UpSet's rows follow the clock
// and the cartogram beside them, so neither column ends in a gap.
const clockRadius = w => Math.max(140,Math.min(245,(w-120)/2));
const dorlingH = w => Math.min(520,Math.max(380,(w-16)*.9));

// Text with a paper halo, so labels stay legible over any fill. Vega-Lite has no
// halo property, so the same text is drawn twice: a thick paper stroke, then ink.
const LON={field:'longitude',type:'quantitative'}, LAT={field:'latitude',type:'quantitative'};
const haloText=(values,mark,encoding={})=>[
  {data:{values},mark:{type:'text',...mark,stroke:C.paper,strokeWidth:4,strokeJoin:'round'},encoding:{longitude:LON,latitude:LAT,text:{field:'text'},...encoding}},
  {data:{values},mark:{type:'text',color:C.ink,...mark},encoding:{longitude:LON,latitude:LAT,text:{field:'text'},...encoding}},
];
const outline=D=>({data:{values:D.australia.features},mark:{type:'geoshape',fill:null,stroke:'#9b9d8d',strokeWidth:.6}});

function gridMap(D,w) {
  // Squares are clipped to the coastline in scripts/prepare_data.py, so no square paints
  // sea; the 94 squares with no land (0.16% of records, mostly boat trips) are not drawn.
  const byCell=Object.fromEntries(D.grid.map(r=>[r.cell,r]));
  const cells=D.gridShapes.features.map(f=>({...f,properties:byCell[f.properties.cell]}));
  // A cell is lit when the busier cells before it hold less than the chosen share,
  // so the lit set is always the fewest squares that reach that share. Lit squares are
  // outlined as regions (precomputed per share), not square by square.
  const regions=D.gridShapes.outlines;
  const shown='abs(datum.properties.cover-cover)<0.001';
  const cities=[{text:'Perth',longitude:115.86,latitude:-31.95},{text:'Melbourne',longitude:144.96,latitude:-37.81},
    {text:'Sydney',longitude:151.21,latitude:-33.87},{text:'Brisbane',longitude:153.03,latitude:-27.47},{text:'Adelaide',longitude:138.6,latitude:-34.93}];
  // Phones get a band above the map for the headline; wider maps carry it in the open sea
  // west of the Kimberley, sized with the map so it never reaches the coast.
  const small=w<440, f=Math.round(Math.max(18,Math.min(26,w/30)));
  // The lit squares are marked with an outline only. Fading the rest would change
  // their lightness, which is the channel carrying record count, so a faded busy
  // square would read as a quiet one (Munzner ch. 11: outline to keep the coding).
  return VL(w-16,mapH(w)+(small?34:0),{description:'2024 observation records in one-degree squares. The control outlines the fewest squares that together hold a chosen share of all records.',
    params:[{name:'cover',value:.5}],projection,layer:[baseMap(D),{
      data:{values:cells},mark:{type:'geoshape',stroke:C.paper,strokeWidth:.45},
      encoding:{color:{field:'properties.count',type:'quantitative',scale:{type:'log',domain:[1,1200000],range:lightRamp},
        legend:{title:'Records in each 1° square',orient:small?'bottom':'bottom-left',values:[1,100,10000,1000000],format:'.0s',gradientLength:small?150:200}},
        tooltip:[tooltip('properties.count','2024 records',','),tooltip('properties.rank','Busiest-square rank'),tooltip('properties.latitude','Latitude'),tooltip('properties.longitude','Longitude')]},
    },{data:{values:regions},transform:[{filter:shown}],mark:{type:'geoshape',fill:null,stroke:C.paper,strokeWidth:4.2,strokeCap:'square'}},
    {data:{values:regions},transform:[{filter:shown}],mark:{type:'geoshape',fill:null,stroke:C.ink,strokeWidth:1.8,strokeCap:'square'}},
    outline(D),
    ...haloText(cities,{fontSize:11,fontWeight:600,dy:15}),
    // Phones: an invisible point north of Cape York widens the fit, opening sea for the headline.
    ...(small?[{data:{values:[{longitude:126,latitude:-6.5}]},mark:{type:'point',opacity:0},encoding:{longitude:LON,latitude:LAT}}]:[]),
    // The running headline on the map itself: how many squares the chosen share needs.
    {data:{values:D.grid},transform:[{filter:'datum.cumBefore < cover'},{aggregate:[{op:'count',as:'n'}]},
      {calculate:"datum.n+' of '+"+cells.length+"+' squares'",as:'line1'},
      {calculate:"'hold '+format(cover,'.0%')+' of all records'",as:'line2'}],
      layer:[{mark:{type:'text',align:'left',baseline:'top',fontSize:small?20:f,fontWeight:600,font:C.display,color:C.green,x:0,y:0},encoding:{text:{field:'line1'}}},
        {mark:{type:'text',align:'left',baseline:'top',fontSize:small||f<22?12:14,color:C.ink,x:1,y:small?26:f+8},encoding:{text:{field:'line2'}}}]},
    ]});
}

function densityMap(D,w) {
  // Two denominators, one map. Colour is each state's position between the lowest and
  // highest value of the chosen measure, on a log scale; the printed number on every
  // state carries the actual value, so no legend lookup is needed.
  const small=w<560;
  const t=r=>({areaT:Math.log(r.density/200)/Math.log(150000/200),peopleT:Math.log(r.perResident/200)/Math.log(1400/200)});
  const rows=stateData(D).map(r=>({...r,...t(r)}));
  const labels=D.states.map(s=>({...s,...t(s),...(s.code==='ACT'?{longitude:153.4,latitude:-35.2}:{})}));
  const value="measure==='area'?datum.density:datum.perResident";
  return VL(w-16,mapH(w),{description:'State and territory choropleth of 2024 records, per 1,000 km² of land or per 1,000 residents. Darker means more records for the chosen denominator.',
    params:[{name:'measure',value:'area'}],projection,
    layer:[{data:{values:rows},transform:[{calculate:"measure==='area'?datum.areaT:datum.peopleT",as:'t'},{calculate:value,as:'value'}],
      mark:{type:'geoshape',stroke:C.paper,strokeWidth:1.3},encoding:{
      color:{field:'t',type:'quantitative',scale:{domain:[0,1],range:lightRamp},legend:null},
      tooltip:[tooltip('state','State / territory'),tooltip('count','2024 records',','),tooltip('density','Per 1,000 km²',',.0f'),tooltip('perResident','Per 1,000 residents',',.0f'),tooltip('population','Residents (ABS, June 2024)',',')],
    }},
    // ACT is a speck at this scale: ring it and lead its label out to sea.
    {data:{values:[{longitude:149.05,latitude:-35.45},{longitude:153.1,latitude:-35.45}]},mark:{type:'line',color:C.ink,strokeWidth:.8},encoding:{longitude:LON,latitude:LAT}},
    {data:{values:[{longitude:149.05,latitude:-35.45}]},mark:{type:'point',size:110,color:C.ink,strokeWidth:1.2},encoding:{longitude:LON,latitude:LAT}},
    // Ink on a paper halo reads on every shade, so no label has to switch colour.
    ...['halo','ink'].map(k=>({data:{values:labels},transform:[{calculate:value,as:'value'},{calculate:"datum.code+'|'+format(datum.value,',.0f')",as:'label'}],
      mark:{type:'text',fontSize:small?11:12,fontWeight:600,lineBreak:'|',lineHeight:15,align:{expr:"datum.code==='ACT'?'left':'center'"},color:C.ink,
        ...(k==='halo'?{stroke:C.paper,strokeWidth:3.5,strokeJoin:'round'}:{})},
      encoding:{longitude:LON,latitude:LAT,text:{field:'label'}}}))]});
}

function seasonalClock(D,w) {
  // The dial grows with the column. Month labels sit at radius+24, so leave
  // room for them on both sides rather than capping the dial at a fixed size.
  const width=w-16, radius=clockRadius(w), H=radius*2+86, cx=width/2,cy=H/2;
  const codes=['NT','QLD','WA','SA','NSW','ACT','VIC','TAS'];
  const inner=38,band=(radius-inner)/8, gap=.64,step=(Math.PI*2-gap)/12;
  const vals=D.stateMonth.map(r=>({...r,a0:gap/2+(r.month-1)*step+.012,a1:gap/2+r.month*step-.012,
    r0:inner+codes.indexOf(r.code)*band+1,r1:inner+(codes.indexOf(r.code)+1)*band-1}));
  const labels=MONTHS.map((label,i)=>({label,angle:gap/2+(i+.5)*step,peak:label===D.insights.peakMonth}));
  return V(width,H,{description:'Circular heatmap of monthly records per day relative to each state’s annual daily average. Rings show states from north to south; sectors follow the calendar.',
    data:[{name:'cells',values:vals},{name:'months',values:labels},
      {name:'rings',values:codes.map((code,i)=>({code,r:inner+(i+.5)*band}))}],
    // Pace is a ratio, so the diverging scale is logarithmic and symmetric about 1:
    // half the usual pace sits as far from the midpoint as double it does.
    scales:[{name:'pace',type:'log',domain:[.5,1,2],range:[CB.brbg[0],CB.brbg[2],CB.brbg[4]],clamp:true}],
    marks:[{type:'arc',from:{data:'cells'},encode:{enter:{x:{value:cx},y:{value:cy},startAngle:{field:'a0'},endAngle:{field:'a1'},innerRadius:{field:'r0'},outerRadius:{field:'r1'},
      fill:{scale:'pace',field:'dailyIndex'},tooltip:{signal:"{'State':datum.state,'Month':datum.label,'Records':format(datum.count,','),'Pace vs state’s usual day':format(datum.dailyIndex,'.2f')+'×'}"}},
      update:{strokeWidth:{value:0}},hover:{stroke:{value:C.ink},strokeWidth:{value:1.4}}}},
      {type:'text',from:{data:'months'},encode:{enter:{x:{signal:`${cx}+sin(datum.angle)*(datum.peak?${radius+12}:${radius+24})`},y:{signal:`${cy}-cos(datum.angle)*${radius+24}`},
        text:{signal:"datum.peak?[datum.label,'busiest month']:datum.label"},align:{signal:"datum.peak?(sin(datum.angle)<0?'right':'left'):'center'"},baseline:{value:'middle'},
        fontSize:{signal:'datum.peak?13:12'},fontWeight:{signal:'datum.peak?700:400'},fill:{signal:`datum.peak?'${C.green}':'${C.ink}'`}}}},
      {type:'text',from:{data:'rings'},encode:{enter:{x:{value:cx},y:{signal:`${cy}-datum.r`},text:{field:'code'},align:{value:'center'},baseline:{value:'middle'},fontSize:{value:w<450?9:11},fill:{value:C.muted}}}},
      {type:'text',encode:{enter:{x:{value:cx},y:{value:cy-3},text:{value:'2024'},align:{value:'center'},fontSize:{value:17},fontWeight:{value:500}}}},
      {type:'text',encode:{enter:{x:{value:cx},y:{value:cy+14},text:{value:'daily pace'},align:{value:'center'},fontSize:{value:9},fill:{value:C.muted}}}},
    ],legends:[{fill:'pace',type:'gradient',direction:'horizontal',orient:'none',legendX:cx-110,legendY:H-6,title:'Records a day, compared with the state’s own average',titleLimit:width-40,titleAnchor:'middle',values:[.5,1,2],gradientLength:220,gradientThickness:9,
      encode:{labels:{update:{text:{signal:"datum.value===1?'usual':datum.value<1?'half':'double'"}}}}}]});
}

function bump(D,w) {
  // Colour carries the reader's choice, not species identity. Seven arbitrary hues
  // would push the page past a handful and would make green mean a bird as well as
  // a record count, so the context lines are one muted grey and the dropdown
  // promotes a single line to ochre.
  const compact=w<680;
  const end=D.rankings.filter(r=>r.month===12),max=Math.max(...D.rankings.map(r=>r.rank));
  const width=w-(compact?118:190);
  const picked="datum.name===highlight";
  // Below about 520px twelve three-letter months overprint each other, so they drop
  // to initials.
  const monthLabel=w<520?"['J','F','M','A','M','J','J','A','S','O','N','D'][datum.value-1]":"['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][datum.value-1]";
  const base={x:{field:'month',type:'ordinal',sort:'ascending',axis:{title:null,labelAngle:0,labelExpr:monthLabel}},
    y:{field:'rank',type:'quantitative',scale:{domain:[1,max],reverse:true,zero:false},axis:{title:'Rank among all birds that month (1 = most records)',titleLimit:400,tickCount:Math.min(max,10),format:'d'}}};
  return VL(width,350,{description:'Monthly ranks for the seven species with the most annual records. Rank is among all named species recorded in that month. The selected bird is drawn in ochre over muted context lines.',
    params:[{name:'highlight',value:'Welcome Swallow'}],
    data:{values:D.rankings},encoding:base,
    layer:[
      {mark:{type:'line',strokeWidth:1.7,interpolate:'monotone',color:'#9aa093'},encoding:{detail:{field:'name'}}},
      {mark:{type:'point',filled:true,size:34,color:'#9aa093',stroke:C.paper,strokeWidth:1},
        encoding:{tooltip:[tooltip('name','Bird'),tooltip('label','Month'),tooltip('rank','Rank'),tooltip('count','Records',',')]}},
      {transform:[{filter:picked}],mark:{type:'line',strokeWidth:3,interpolate:'monotone',color:C.ochre},encoding:{detail:{field:'name'}}},
      {transform:[{filter:picked}],mark:{type:'point',filled:true,size:72,color:C.ochre,stroke:C.paper,strokeWidth:1.4},
        encoding:{tooltip:[tooltip('name','Bird'),tooltip('label','Month'),tooltip('rank','Rank'),tooltip('count','Records',',')]}},
      // The default view's finding, written where it happens: under the June low, and in the
      // clear band above the flat September–December run, so no grey line passes behind it.
      ...[{month:6,rank:8,text:'8th in June',align:'center',dx:0,dy:17},{month:11,rank:2,text:'2nd from September',align:'center',dx:0,dy:-15}].flatMap(a=>
        [{stroke:C.paper,strokeWidth:3.5,strokeJoin:'round'},{}].map(halo=>({data:{values:[a]},transform:[{filter:"highlight==='Welcome Swallow'"}],
          mark:{type:'text',align:a.align,dx:a.dx,dy:a.dy,baseline:'middle',fontSize:12,fontWeight:600,color:C.ochreText,...halo},
          encoding:{x:base.x,y:base.y,text:{field:'text'}}}))),
      {data:{values:end},transform:[{filter:'!('+picked+')'}],
        mark:{type:'text',align:'left',dx:13,fontSize:compact?10:11,color:C.muted},encoding:{...base,text:{field:'name'}}},
      {data:{values:end},transform:[{filter:picked}],
        mark:{type:'text',align:'left',dx:13,fontSize:compact?10:11,fontWeight:700,color:C.ochreText},encoding:{...base,text:{field:'name'}}},
    ]});
}

function beeMap(D,w) {
  // Proportional symbols overplot past a few dozen per map (Week 8 notes). The 1°
  // squares gave about 250 circles a season plus as many rings, so they are summed
  // into 2° squares here, which halves the count. ALA's 1° points are rounded to whole
  // degrees, so each stands for the cell ±0.5° around it, and each 2° circle is drawn at
  // the record-weighted mean of its points: on the records, not on an offshore corner.
  const bins=new Map();
  for(const r of D.beeMap){
    const lat0=Math.floor(r.latitude/2)*2, lon0=Math.floor(r.longitude/2)*2, k=`${r.season}|${lat0}|${lon0}`;
    if(!bins.has(k))bins.set(k,{season:r.season,count:0,sumLat:0,sumLon:0,
      square:`${Math.abs(lat0+1.5)}–${Math.abs(lat0-.5)}°S, ${lon0-.5}–${lon0+1.5}°E`});
    const b=bins.get(k);b.count+=r.count;b.sumLat+=r.latitude*r.count;b.sumLon+=r.longitude*r.count;
  }
  const cells=[...bins.values()].map(({sumLat,sumLon,...b})=>({...b,latitude:sumLat/b.count,longitude:sumLon/b.count}));
  const max=Math.max(...cells.map(r=>r.count)), small=w<560;
  // The opposite season stays on the map as hollow rings, so the comparison never
  // depends on remembering a previous frame.
  const opposite="{'Summer':'Winter','Winter':'Summer','Autumn':'Spring','Spring':'Autumn'}[season]";
  const size={field:'count',type:'quantitative',scale:{domain:[0,max],range:[0,small?560:980]},legend:{title:'Bee-eater records in a 2° square',orient:'bottom',direction:'horizontal',values:[100,500,1500],symbolFillColor:'#d9bd90',symbolStrokeColor:'#9b6a26',symbolStrokeWidth:1,symbolOpacity:1}};
  const colour={field:'season',type:'nominal',scale:{domain:SEASONS,range:C.seasons},legend:null};
  const tip=[tooltip('season','Season'),tooltip('count','Bee-eater records',','),tooltip('square','2° square')];
  return VL(w-16,mapH(w),{description:'Proportional-symbol map of rainbow bee-eater records in two-degree squares for the chosen season, with the opposite season drawn as hollow rings. Circle area represents count, on one fixed scale.',
    params:[{name:'season',value:'Summer'}],projection,layer:[baseMap(D),
      {data:{values:cells},transform:[{filter:`datum.season===${opposite}`}],mark:{type:'circle',filled:false,strokeWidth:1.1,opacity:.75},encoding:{longitude:LON,latitude:LAT,size,color:colour,tooltip:tip}},
      {data:{values:cells},transform:[{filter:'datum.season===season'}],mark:{type:'circle',opacity:.78,stroke:C.paper,strokeWidth:.6},encoding:{longitude:LON,latitude:LAT,size,color:colour,tooltip:tip}},
      {data:{values:[{longitude:112,latitude:-30},{longitude:154,latitude:-30}]},mark:{type:'line',strokeDash:[4,5],color:C.ink,strokeWidth:1},encoding:{longitude:LON,latitude:LAT}},
      {data:{values:[{longitude:112.2,latitude:-30}]},mark:{type:'text',align:'left',baseline:'bottom',dy:-4,fontSize:11,color:C.muted,text:'30°S'},encoding:{longitude:LON,latitude:LAT}},
      // The finding, recomputed for whichever season is showing, printed beside the line.
      {data:{values:D.beeMonth},transform:[{filter:'datum.season===season'},
        {aggregate:[{op:'sum',field:'southOf30',as:'south'},{op:'sum',field:'count',as:'n'}]},
        {calculate:"format(datum.south/datum.n,'.0%')",as:'share'},{calculate:"'of '+lower(season)+' records'",as:'what'},
        // In the Great Australian Bight; on a phone the Bight is too narrow, so open sea south-west of WA.
        {calculate:small?'113.6':'125.6',as:'longitude'},{calculate:small?'-35.2':'-33.1',as:'latitude'}],
        layer:[{mark:{type:'text',align:'left',baseline:'top',dy:9,fontSize:small?22:30,fontWeight:500,font:C.display,color:C.ink,stroke:C.paper,strokeWidth:4},encoding:{longitude:LON,latitude:LAT,text:{field:'share'}}},
          {mark:{type:'text',align:'left',baseline:'top',dy:9,fontSize:small?22:30,fontWeight:500,font:C.display,color:C.ink},encoding:{longitude:LON,latitude:LAT,text:{field:'share'}}},
          {mark:{type:'text',align:'left',baseline:'top',dy:small?35:45,fontSize:12,color:C.ink,stroke:C.paper,strokeWidth:4},encoding:{longitude:LON,latitude:LAT,text:{field:'what'}}},
          {mark:{type:'text',align:'left',baseline:'top',dy:small?35:45,fontSize:12,color:C.ink},encoding:{longitude:LON,latitude:LAT,text:{field:'what'}}},
          {mark:{type:'text',align:'left',baseline:'top',dy:small?50:60,fontSize:12,color:C.muted},encoding:{longitude:LON,latitude:LAT,text:{value:'lie south of 30°S'}}}]},
    ]});
}

function seasonField(D,w) {
  // Filled isolines of a smoothed field: where does a place's share of winter records
  // outweigh its share of summer records? The two seasons keep their own hues, and
  // lightness carries strength, so the pale middle band means no seasonal lean.
  // Six bands on a constant interval: every boundary is a doubling of the ratio, and
  // the middle boundary is equal shares. ColorBrewer BrBG-6, with the two seasons'
  // hues and lightness carrying how strong the lean is.
  const bands=['Summer share 4× or more','Summer share 2–4×','Summer share up to 2×','Winter share up to 2×','Winter share 2–4×','Winter share 4× or more'];
  const none='Too few records to estimate';
  const small=w<560;
  const colour={field:'properties.label',type:'ordinal',scale:{domain:[...bands,none],range:['#8c510a','#d8b365','#f6e8c3','#c7eae5','#5ab4ac','#01665e','#d6d2c6']},
    legend:{title:'Season with the bigger share of a place’s records',titleLimit:w,orient:'bottom',direction:'horizontal',columns:small?2:3,symbolType:'square',symbolSize:160,symbolStrokeColor:'#b9b4a4',symbolStrokeWidth:.6,labelLimit:220,columnPadding:18,rowPadding:6}};
  return VL(w-16,mapH(w),{description:'Filled contour map of a smoothed field: for each place, its share of all winter (June–August) records divided by its share of all summer (December–February) records, 2024. Contours fall on a constant interval of one doubling. Toggle between all bird records and rainbow bee-eater records. Grey land has too few records to estimate.',
    params:[{name:'who',value:'Everyone'}],projection,layer:[{data:{values:D.australia.features},mark:{type:'geoshape',stroke:'#c7c6b8',strokeWidth:.7},
        encoding:{color:{datum:none,type:'ordinal',scale:colour.scale},tooltip:{value:none}}},
      {data:{values:D.seasonField.features},transform:[{filter:'datum.properties.who===who && isValid(datum.properties.label)'}],mark:{type:'geoshape',strokeWidth:0},
        encoding:{color:colour,tooltip:[tooltip('properties.label','Seasonal lean')]}},
      // The equal-share isoline is the index contour: drawn heavier, as the notes ask.
      {data:{values:D.seasonField.features},transform:[{filter:'datum.properties.who===who && datum.properties.line===0'}],mark:{type:'geoshape',fill:null,filled:false,stroke:C.ink,strokeWidth:1.1,strokeOpacity:.7}},
      outline(D),
      {data:{values:[{longitude:112,latitude:-30},{longitude:154,latitude:-30}]},mark:{type:'line',strokeDash:[4,5],color:C.ink,strokeWidth:1},encoding:{longitude:LON,latitude:LAT}},
      ...haloText([{text:'30°S',longitude:113.2,latitude:-30}],{fontSize:11,dy:-9,align:'left',color:C.muted}),
      ...haloText([{text:'Tropical north',longitude:133.5,latitude:-17.5},{text:'Temperate south',longitude:141.6,latitude:-35.2}],{fontSize:small?11:13,fontWeight:600,fontStyle:'italic'}),
    ]});
}

function ridgeline(D,w) {
  const width=w-64,H=470,step=32, baseline=22;
  const data=D.beeRidges.map(r=>({...r,south:Math.abs(r.latitude)}));
  return V(width,H,{description:'Monthly latitude distributions of rainbow bee-eater records. Each ridge is normalised to that month’s bee-eater records, at one-degree latitude bins. Peaks show where records concentrate, not a bird’s flight path.',
    padding:{left:46,right:10,top:16,bottom:40},
    data:[{name:'ridges',values:data},{name:'months',values:D.beeMonth}],
    scales:[{name:'x',type:'linear',domain:[-44,-10],range:'width',nice:false,zero:false},
      {name:'season',type:'ordinal',domain:SEASONS,range:C.seasons}],
    axes:[{orient:'bottom',scale:'x',values:[-40,-35,-30,-25,-20,-15,-10],title:null,
      encode:{labels:{update:{text:{signal:"abs(datum.value)+'°S'"}}}}}],
    marks:[
      // Direction labels at the two ends of the axis; spaces in an axis title collapse.
      {type:'text',encode:{enter:{x:{value:0},y:{signal:'height+34'},text:{value:'← South'},align:{value:'left'},fontSize:{value:12},fontWeight:{value:500},fill:{value:C.ink}}}},
      {type:'text',encode:{enter:{x:{signal:'width'},y:{signal:'height+34'},text:{value:'North →'},align:{value:'right'},fontSize:{value:12},fontWeight:{value:500},fill:{value:C.ink}}}},{type:'rule',encode:{enter:{x:{scale:'x',value:-30},y:{value:0},y2:{value:H-20},stroke:{value:C.muted},strokeDash:{value:[3,5]},strokeOpacity:{value:.5}}}},
      {type:'group',from:{facet:{name:'series',data:'ridges',groupby:['month','season']}},
        encode:{enter:{y:{signal:`(datum.month-1)*${step}+${baseline}`},height:{value:step},width:{signal:'width'}}},
        marks:[{type:'rule',encode:{enter:{x:{value:0},x2:{signal:'width'},y:{value:step},stroke:{value:C.rule},strokeWidth:{value:.6}}}},
          {type:'area',from:{data:'series'},sort:{field:'datum.latitude'},encode:{enter:{x:{scale:'x',field:'latitude'},y:{signal:`${step}-datum.share*${step*5.2}`},y2:{value:step},
            fill:{scale:'season',field:'season'},fillOpacity:{value:.48},stroke:{scale:'season',field:'season'},strokeWidth:{value:1.25},interpolate:{value:'monotone'}}}},
          {type:'symbol',from:{data:'series'},encode:{enter:{x:{scale:'x',field:'latitude'},y:{signal:`${step}-datum.share*${step*5.2}`},size:{value:90},fill:{value:'transparent'},
            tooltip:{signal:"{'Month':datum.label,'Latitude':abs(datum.latitude)+'°S','Bee-eater records':format(datum.count,','),'Share of month':format(datum.share,'.1%')}"}}}},
        ]},
      // Half of each month's records lie south of its tick.
      {type:'symbol',from:{data:'months'},encode:{enter:{x:{scale:'x',field:'medianLatitude'},y:{signal:`datum.month*${step}+${baseline}+1`},shape:{value:'triangle-up'},size:{value:46},fill:{value:C.ink},
        tooltip:{signal:"{'Month':datum.label,'Half of records lie south of':abs(datum.medianLatitude)+'°S'}"}}}},
      {type:'symbol',encode:{enter:{x:{value:4},y:{value:H-4},shape:{value:'triangle-up'},size:{value:46},fill:{value:C.ink}}}},
      {type:'text',encode:{enter:{x:{value:13},y:{value:H-4},baseline:{value:'middle'},text:{value:'Middle of the month’s records: half lie south of the tick'},fontSize:{value:11},fill:{value:C.muted}}}},
      {type:'text',from:{data:'months'},encode:{enter:{x:{value:-10},y:{signal:`(datum.month-1)*${step}+${baseline+step-3}`},text:{field:'label'},align:{value:'right'},fontSize:{value:12}}}},
    ]});
}

function seasonMatrix(D,w) {
  // The flat rows are the control, not filler: grouping them against the birds
  // that swing makes the contrast the chart's actual claim.
  // The bee-eater sits with the steady birds: nationally its share hardly moves,
  // because it relocates within Australia rather than leaving (see the bee-eater maps).
  const groups={
    'Share swings with the seasons':['White-throated Needletail','Eastern Koel','Red-necked Stint'],
    'Share steady all year':['Rainbow Bee-eater','Silvereye','Welcome Swallow','Superb Fairy-wren','Australian Magpie'],
  };
  const order=Object.keys(groups);
  const group=new Map(order.flatMap(g=>groups[g].map(name=>[name,g])));
  const rows=D.speciesMonth.filter(r=>group.has(r.name)).map(r=>({...r,group:group.get(r.name)}));
  // Row height follows the seasonal clock beside it (its SVG is about 2r + 150 px; this
  // chart's is 8 rows + 209 px), capped so cells are never more than 1.5 times as tall as wide.
  const compact=w<500, width=w-(compact?146:190), step=Math.round(Math.max(26,Math.min(56,width/12*1.5,(2*clockRadius(w)-59)/8)));
  return {$schema:'https://vega.github.io/schema/vega-lite/v5.json',padding:8,config,
    description:'Monthly share of all records for eight featured species, divided by each species’ annual share. One means the species occupies its typical share. Rows are grouped into birds whose share swings through the year and birds recorded steadily all year. This adjusts for total monthly record volume, not survey effort.',
    data:{values:rows},spacing:30,resolve:{scale:{y:'independent'}},
    facet:{row:{field:'group',type:'nominal',sort:order,title:null,
      header:{labelAngle:0,labelAlign:'left',labelAnchor:'start',labelOrient:'top',labelPadding:6,
        labelFontSize:compact?11:13,labelFontWeight:600,labelColor:C.ink,labelFont:FONT}}},
    spec:{width:Math.max(180,Math.round(width)),height:{step},
      mark:{type:'rect',stroke:C.paper,strokeWidth:2,cornerRadius:1},
      encoding:{x:{field:'label',type:'ordinal',sort:MONTHS,axis:{title:null,labelAngle:0,...(w<520?{labelExpr:'substring(datum.value,0,1)'}:{})}},
        y:{field:'name',type:'ordinal',sort:order.flatMap(g=>groups[g]),axis:{title:null,labelLimit:compact?130:210,labelFontSize:compact?10:12}},
        color:{field:'relative',type:'quantitative',scale:{type:'log',domain:[.25,1,4],range:[CB.brbg[0],CB.brbg[2],CB.brbg[4]],clamp:true},
          legend:{title:'Share relative to annual share',titleLimit:280,orient:'bottom',values:[.25,1,4],format:'.2~f',gradientLength:180}},
        tooltip:[tooltip('name','Bird'),tooltip('label','Month'),tooltip('count','Records',','),tooltip('per10k','Per 10,000 bird records','.1f'),tooltip('relative','Relative to annual share','.2f')]}}};
}

function swarm(D,w) {
  // Rows are packed as tight as their swarms allow, so the dots read as clusters, not a
  // sparse strip. The two extremes the headline names are labelled on the chart.
  const small=w<560, width=w-(small?40:70), statuses=['Vulnerable','Endangered','Critically Endangered'];
  const r=Math.max(4.5,Math.min(10.5,width/150)), d=2*r+1.5;
  const x=n=>(Math.log10(n)/Math.log10(15000))*width;
  const all=[...D.threatenedRecords].sort((a,b)=>b.count-a.count);
  const top=all[0], bottom=all[all.length-1];
  const rows=[], bands=[];
  let cursor=0;
  for(const status of statuses){
    const placed=[];
    for(const b of all.filter(b=>b.status===status)){
      const px=x(b.count);let py=0;
      const candidates=[0,...Array.from({length:12},(_,k)=>[(k+1)*d*.88,-(k+1)*d*.88]).flat()];
      for(const c of candidates){if(placed.every(p=>Math.hypot(px-p.x,c-p.y)>=d)){py=c;break;}}
      placed.push({x:px,y:py,b});
    }
    const lo=Math.min(...placed.map(p=>p.y))-r, hi=Math.max(...placed.map(p=>p.y))+r;
    const hasTop=placed.some(p=>p.b===top), hasBottom=placed.some(p=>p.b===bottom);
    // The least-recorded bird is labelled on its own line when the gap to the next dot
    // allows (wide screens), otherwise beneath the swarm. The most-recorded is labelled above.
    const next=hasBottom?Math.min(...placed.filter(p=>p.b!==bottom).map(p=>p.x)):0;
    const inline=hasBottom&&next-x(bottom.count)>r*2+8+bottom.name.length*6.4+80;
    const centre=cursor+22-lo+(hasTop?26:0);
    for(const p of placed)rows.push({...p.b,cy:centre+p.y,centre,lo,hi,inline});
    bands.push({status,n:placed.length,labelY:cursor+8,y:centre});
    cursor=centre+Math.max(hi,hasBottom&&!inline?hi+22:0)+(small?18:24);
  }
  const H=Math.round(cursor);
  const fmt=n=>n.toLocaleString('en-AU');
  const rowOf=b=>rows.find(row=>row.scientific===b.scientific);
  const notes=[
    {...rowOf(top),text:[top.name,fmt(top.count)+' records'],align:'right',baseline:'bottom',dx:r},
    {...rowOf(bottom),text:bottom.name+' · '+fmt(bottom.count)+' records',align:'left',baseline:'middle'}];
  // Most-recorded: two lines above its swarm, ending at its dot, with a leader down to it.
  // Least-recorded: beside its dot when the gap allows, otherwise beneath the swarm with a leader.
  // Vega stacks a multi-line label downward from its anchor, so the anchor is the first line.
  Object.assign(notes[0],{ny:notes[0].centre+notes[0].lo-6-15,y1:notes[0].centre+notes[0].lo-3,y2:notes[0].cy-r-2});
  Object.assign(notes[1],notes[1].inline?{dx:r+8,ny:notes[1].cy,y1:0,y2:0}
    :{dx:-r,ny:notes[1].centre+notes[1].hi+16,y1:notes[1].cy+r+2,y2:notes[1].centre+notes[1].hi+7});
  return V(width,H,{description:'Beeswarm showing the record counts of 65 nationally threatened, species-level birds whose scientific names match exactly between ALA and DCCEEW. Every dot is a species. Unmatched names and listed subspecies are excluded, not treated as zero.',
    padding:{left:small?14:24,right:small?14:20,top:6,bottom:50},
    data:[{name:'birds',values:rows},{name:'bands',values:bands},{name:'notes',values:notes}],
    scales:[{name:'x',type:'log',domain:[1,15000],range:'width',nice:false},
      {name:'color',type:'ordinal',domain:statuses,range:CB.orrd}],
    axes:[{scale:'x',orient:'bottom',values:[1,10,100,1000,10000],format:',',title:'2024 records per species · logarithmic scale',grid:true,gridColor:'#ebe5d8'}],
    marks:[{type:'rule',from:{data:'bands'},encode:{enter:{x:{value:0},x2:{signal:'width'},y:{field:'y'},stroke:{value:C.rule},strokeWidth:{value:.7}}}},
      {type:'text',from:{data:'bands'},encode:{enter:{x:{value:0},y:{field:'labelY'},baseline:{value:'middle'},fontSize:{value:12},fill:{value:C.muted},
        text:{signal:"datum.status+' · '+datum.n"}}}},
      {type:'symbol',from:{data:'birds'},encode:{enter:{x:{scale:'x',field:'count'},y:{field:'cy'},
        fill:{scale:'color',field:'status'},stroke:{value:C.paper},strokeWidth:{value:1},
        tooltip:{signal:"{'Bird':datum.name,'Scientific name':datum.scientific,'Listing in Aug 2026':datum.status,'2024 records':format(datum.count,',')}"}},
        update:{size:{value:Math.round(Math.PI*r*r)},stroke:{value:C.paper}},hover:{size:{value:Math.round(Math.PI*r*r*2)},stroke:{value:C.ink}}}},
      {type:'rule',from:{data:'notes'},interactive:false,encode:{enter:{x:{scale:'x',field:'count'},y:{field:'y1'},y2:{field:'y2'},
        stroke:{value:C.ink},strokeWidth:{value:1},opacity:{signal:'datum.y2>datum.y1+2?1:0'}}}},
      {type:'text',from:{data:'notes'},interactive:false,encode:{enter:{x:{scale:'x',field:'count',offset:{field:'dx'}},y:{field:'ny'},
        align:{field:'align'},baseline:{field:'baseline'},lineHeight:{value:15},text:{field:'text'},fontSize:{value:12},fontWeight:{value:600},fill:{value:C.ink}}}},
    ]});
}

const vegaProjection={name:'projection',type:'conicEqualArea',parallels:[-18,-36],rotate:[-134,0,0],center:[0,-28],
  fit:{signal:"data('states')"},size:{signal:'[width,height]'}};

function stateCircles(D,w) {
  // Dorling cartogram, the textbook form from the Week 9 notes: circle area is one
  // attribute (threatened bird taxa listed in the jurisdiction) and colour adds a
  // second (2024 records), so both halves of the headline show with no control.
  // Records use the journal's green volume ramp, light low and dark high.
  const width=w-16,H=dorlingH(w),band=58,mapH=H-band,R=Math.min(width,mapH)*.15;
  const maxListed=Math.max(...D.states.map(s=>s.listed));
  return V(width,H,{description:'Dorling cartogram of the eight states and territories. Circle area is proportional to the number of nationally listed threatened bird taxa associated with the jurisdiction; colour lightness shows its 2024 bird records. Select a circle to highlight its combinations in the overlap chart.',
    signals:[{name:'picked',value:'',on:[{events:'symbol:click',update:"picked===datum.code?'':datum.code"},{events:'dblclick',update:"''"}]},
      // Lowest circle edge once the layout settles: the legend sits beneath it.
      {name:'circleBottom',update:"extent(pluck(data('nodes'),'bottom'))[1]"}],
    projections:[{...vegaProjection,size:[width,mapH]}],
    scales:[{name:'records',type:'linear',domain:[300000,2500000],range:[CB.greens[1],CB.greens[4]],clamp:true}],
    data:[{name:'states',values:D.australia.features},
      {name:'nodes',values:D.states.map(s=>({code:s.code,state:s.state,count:s.count,listed:s.listed,longitude:s.longitude,latitude:s.latitude,
          r:Math.max(9,Math.sqrt(s.listed/maxListed)*R)})),
        transform:[
          {type:'formula',expr:"scale('projection',[datum.longitude,datum.latitude])[0]",as:'tx'},
          {type:'formula',expr:"scale('projection',[datum.longitude,datum.latitude])[1]",as:'ty'},
          {type:'formula',expr:'datum.tx',as:'x'},{type:'formula',expr:'datum.ty',as:'y'},
          {type:'force',static:true,iterations:300,forces:[{force:'collide',radius:{expr:'datum.r+3'},strength:1,iterations:6},
            {force:'x',x:'tx',strength:.05},{force:'y',y:'ty',strength:.05}]},
          // Circles may settle below the coast (Tasmania is pushed south by Victoria); clamping them
          // back up would re-create the overlaps the collide force removed, so only the sides are held.
          {type:'formula',expr:'clamp(datum.x,datum.r+2,width-datum.r-2)',as:'x'},{type:'formula',expr:'datum.y+datum.r',as:'bottom'}]}],
    marks:[{type:'shape',from:{data:'states'},encode:{enter:{fill:{value:'#ebe7dc'},stroke:{value:'#d5d0c1'},strokeWidth:{value:.7}}},transform:[{type:'geoshape',projection:'projection'}]},
      {type:'symbol',from:{data:'nodes'},encode:{update:{x:{field:'x'},y:{field:'y'},size:{signal:'PI*datum.r*datum.r'},cursor:{value:'pointer'},
        fill:{scale:'records',field:'count'},fillOpacity:{signal:"picked===''||picked===datum.code?1:.35"},
        stroke:{signal:`picked===datum.code?'${C.ink}':'${C.paper}'`},strokeWidth:{signal:'picked===datum.code?2.5:1.5'},
        tooltip:{signal:"{'Jurisdiction':datum.state,'Listed threatened bird taxa':datum.listed,'2024 bird records':format(datum.count,',')}"}}}},
      // Ink on a paper halo stays readable on every shade of green.
      ...['halo','ink'].flatMap(k=>{const halo=k==='halo'?{stroke:{value:C.paper},strokeWidth:{value:3.5},strokeJoin:{value:'round'}}:{};return [
        {type:'text',from:{data:'nodes'},interactive:false,encode:{update:{x:{field:'x'},y:{signal:'datum.y-6'},text:{field:'code'},align:{value:'center'},baseline:{value:'middle'},
          fontSize:{signal:'datum.r>26?12:11'},fontWeight:{value:700},fill:{value:C.ink},...halo}}},
        {type:'text',from:{data:'nodes'},interactive:false,encode:{update:{x:{field:'x'},y:{signal:'datum.y+8'},align:{value:'center'},baseline:{value:'middle'},
          text:{signal:"datum.r>26?datum.listed+' listed':datum.listed"},fontSize:{signal:'datum.r>26?11:10'},fill:{value:C.ink},...halo}}}];}),
    ],
    legends:[{fill:'records',type:'gradient',direction:'horizontal',orient:'none',legendX:0,legendY:{signal:'max(circleBottom,'+mapH+')+16'},title:'2024 bird records in the state',
      values:[500000,1000000,1500000,2000000,2500000],format:'.2~s',gradientLength:Math.min(240,width-20),gradientThickness:9}]});
}

function upset(D,w) {
  const width=w-66,H=Math.round(dorlingH(w)+72),step=Math.min(38,Math.round(H/16)),base=H-61-7*step,top=base+38,codes=['WA','NT','SA','QLD','NSW','VIC','TAS','ACT'];
  // Vega stamps every datum it ingests with a tuple id kept on a symbol key, and
  // object spread copies symbol keys. Spreading one combination into eight row
  // objects would therefore hand all eight the same id on any redraw after the
  // first, and Vega would keep only the last, collapsing the matrix onto a single
  // row. Copy the fields explicitly so each row object is genuinely new.
  const combo=c=>({id:c.id,combination:c.combination,count:c.count,states:[...c.states]});
  const bars=D.upset.map(combo);
  const matrix=D.upset.flatMap(c=>codes.map((code,row)=>({...combo(c),code,row,active:c.states.includes(code)})));
  const rules=D.upset.map(c=>({...combo(c),min:Math.min(...c.states.map(s=>codes.indexOf(s))),max:Math.max(...c.states.map(s=>codes.indexOf(s)))}));
  // picked is set from the cartogram beside this chart: columns that include the
  // selected state keep their colour and the rest fade.
  const on="picked==='' || indexof(datum.states,picked)>=0";
  return V(width,H,{description:'An UpSet chart of the twelve most common exact state combinations among 150 extant threatened bird taxa listed by DCCEEW in the eight jurisdictions. A connected column is an exact combination of states, and the bar above counts listed taxa in it.',
    padding:{left:45,right:10,top:20,bottom:18},
    signals:[{name:'picked',value:'',on:[{events:'@rowlabel:click',update:"picked===datum.code?'':datum.code"}]}],
    data:[{name:'bars',values:bars},{name:'matrix',values:matrix},{name:'links',values:rules},{name:'codes',values:codes.map((code,row)=>({code,row}))}],
    scales:[{name:'x',type:'band',domain:{data:'bars',field:'id'},range:'width',padding:.28},
      {name:'y',type:'linear',domain:[0,Math.max(...bars.map(r=>r.count))*1.22],range:[base,0],zero:true}],
    marks:[{type:'rect',from:{data:'codes'},encode:{update:{x:{value:-40},x2:{signal:'width'},y:{signal:top+'+datum.row*'+step+'-'+step*.45},height:{value:step*.9},fill:{value:'#efe3dc'},opacity:{signal:'picked===datum.code?1:0'}}}},
      {type:'rect',from:{data:'bars'},encode:{enter:{x:{scale:'x',field:'id'},width:{scale:'x',band:1},y:{scale:'y',field:'count'},y2:{value:base},
      tooltip:{signal:"{'Exactly these states':datum.combination,'Listed bird taxa':datum.count}"}},update:{fill:{signal:`${on}?'${C.rust}':'#e6d8d2'`}}}},
      {type:'text',from:{data:'bars'},encode:{enter:{x:{scale:'x',field:'id',band:.5},y:{scale:'y',field:'count',offset:-7},text:{field:'count'},align:{value:'center'},fontSize:{value:12},fontWeight:{value:600}},
        update:{fill:{signal:`${on}?'${C.ink}':'${C.muted}'`}}}},
      // Two worked examples, so the matrix can be decoded from the chart itself.
      {type:'text',from:{data:'bars'},encode:{enter:{x:{scale:'x',field:'id',band:0},y:{scale:'y',field:'count',offset:-24},align:{value:'left'},fontSize:{value:11},fontStyle:{value:'italic'},fill:{value:C.muted},
        text:{signal:"datum.states.length===1&&datum.id===0?'only '+datum.states[0]:datum.id===1?'shared by '+datum.states.length:''"}}}},
      {type:'rule',encode:{enter:{x:{value:0},x2:{signal:'width'},y:{value:base+17},stroke:{value:C.rule}}}},
      {type:'rule',from:{data:'links'},encode:{enter:{x:{scale:'x',field:'id',band:.5},y:{signal:top+'+datum.min*'+step},y2:{signal:top+'+datum.max*'+step},strokeWidth:{value:1.5}},
        update:{stroke:{signal:`${on}?'${C.ink}':'#cfcabc'`}}}},
      {type:'symbol',from:{data:'matrix'},encode:{enter:{x:{scale:'x',field:'id',band:.5},y:{signal:top+'+datum.row*'+step},size:{value:w<500?28:54},
        tooltip:{signal:"{'Exactly these states':datum.combination,'Listed bird taxa':datum.count,'State':datum.code,'Included':datum.active?'Yes':'No'}"}},
        update:{fill:{signal:`!datum.active?'#dedace':${on}?'${C.ink}':'#cfcabc'`}}}},
      {type:'text',name:'rowlabel',from:{data:'codes'},encode:{enter:{x:{value:-12},y:{signal:top+'+datum.row*'+step},text:{field:'code'},align:{value:'right'},baseline:{value:'middle'},cursor:{value:'pointer'}},
        update:{fontSize:{signal:'picked===datum.code?13:11'},fontWeight:{signal:"picked===datum.code?700:400"},fill:{signal:`picked===datum.code?'${C.rust}':'${C.ink}'`}}}},
    ]});
}

export const chartBuilders = {
  'observation-atlas':gridMap,
  'record-density':densityMap,
  'seasonal-clock':seasonalClock,
  'monthly-ranks':bump,
  'seasonal-footprint':beeMap,
  'latitude-ridges':ridgeline,
  'season-field':seasonField,
  'state-circles':stateCircles,
  'seasonal-signatures':seasonMatrix,
  'threatened-swarm':swarm,
  'shared-responsibility':upset,
};

export const chartFiles = {
  'observation-atlas':'grid', 'record-density':'states', 'seasonal-clock':'state-month',
  'monthly-ranks':'rankings', 'seasonal-footprint':'bee-map', 'latitude-ridges':'bee-ridges',
  'season-field':'season-field', 'state-circles':'states', 'seasonal-signatures':'species-month',
  'threatened-swarm':'threatened-records', 'shared-responsibility':'upset',
};
