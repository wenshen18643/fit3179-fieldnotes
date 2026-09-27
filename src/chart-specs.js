// Original, data-driven Vega and Vega-Lite specifications for the field journal.
// Also used by the browser: the published JSONs and live figures share one source.
export const C = {
  ink: '#292e27', muted: '#60665c', rule: '#d5d0c1', paper: '#f8f5ec',
  // Green means record volume everywhere in the journal, ochre means below the
  // usual volume, and rust is reserved for conservation. Nothing else encodes a
  // hue, which is why there is no categorical species palette here any more.
  green: '#315e4c', ochre: '#ad7926', ochreText: '#875c1b', rust: '#a74735',
  // The four seasons are the one categorical scale left. No pair is red against
  // green: that is the pairing that collapses for the commonest colour blindness,
  // so autumn is a mauve rather than a rust.
  seasons: ['#b0782c', '#8c5a86', '#557784', '#58723e'],
};
const FONT = 'Bricolage Grotesque';
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
const VL = (width,height,body) => ({$schema:'https://vega.github.io/schema/vega-lite/v5.json',
  width:Math.max(180,Math.round(width)),height:Math.round(height),padding:8,config,...body});
const V = (width,height,body) => ({$schema:'https://vega.github.io/schema/vega/v5.json',
  width:Math.max(220,Math.round(width)),height:Math.round(height),padding:8,background:'transparent',
  autosize:{type:'pad',contains:'padding'},config:{text:{font:FONT,fill:C.ink},axis:config.axis,legend:config.legend},...body});
const tooltip = (field,title,format) => ({field,title,...(format?{format}:{})});
const stateData = D => D.australia.features.map(f=>({...f,...D.states.find(s=>s.code===f.properties.code)}));
const baseMap = D => ({data:{values:D.australia.features},mark:{type:'geoshape',fill:'#e8e4d9',stroke:'#c7c6b8',strokeWidth:.7}});
const mapH = w => Math.min(520, Math.max(270,w*.7));

// Text with a paper halo, so labels stay legible over any fill. Vega-Lite has no
// halo property, so the same text is drawn twice: a thick paper stroke, then ink.
const LON={field:'longitude',type:'quantitative'}, LAT={field:'latitude',type:'quantitative'};
const haloText=(values,mark,encoding={})=>[
  {data:{values},mark:{type:'text',...mark,stroke:C.paper,strokeWidth:4,strokeJoin:'round'},encoding:{longitude:LON,latitude:LAT,text:{field:'text'},...encoding}},
  {data:{values},mark:{type:'text',color:C.ink,...mark},encoding:{longitude:LON,latitude:LAT,text:{field:'text'},...encoding}},
];
const outline=D=>({data:{values:D.australia.features},mark:{type:'geoshape',fill:null,stroke:'#9b9d8d',strokeWidth:.6}});

function gridMap(D,w) {
  const cells=D.grid.map(r=>({type:'Feature',properties:r,geometry:{type:'Polygon',coordinates:[[
    [r.longitude-.5,r.latitude-.5],[r.longitude-.5,r.latitude+.5],
    [r.longitude+.5,r.latitude+.5],[r.longitude+.5,r.latitude-.5],[r.longitude-.5,r.latitude-.5],
  ]]}}));
  // A cell is lit when the busier cells before it hold less than the chosen share,
  // so the lit set is always the fewest squares that reach that share.
  const lit='datum.properties.cumBefore < cover';
  const cities=[{text:'Perth',longitude:115.86,latitude:-31.95},{text:'Melbourne',longitude:144.96,latitude:-37.81},
    {text:'Sydney',longitude:151.21,latitude:-33.87},{text:'Brisbane',longitude:153.03,latitude:-27.47},{text:'Adelaide',longitude:138.6,latitude:-34.93}];
  const small=w<560;
  return VL(w-16,mapH(w),{description:'2024 observation records in one-degree squares. The control lights the fewest squares that together hold a chosen share of all records; the rest fade.',
    params:[{name:'cover',value:.5}],projection,layer:[baseMap(D),{
      data:{values:cells},mark:{type:'geoshape',stroke:C.paper,strokeWidth:.45},
      encoding:{color:{field:'properties.count',type:'quantitative',scale:{type:'log',domain:[1,1200000],range:lightRamp},
        legend:{title:'Records in each 1° square',orient:'bottom-left',values:[1,100,10000,1000000],format:'.0s',gradientLength:small?150:200}},
        opacity:{condition:{test:lit,value:1},value:.38},
        tooltip:[tooltip('properties.count','2024 records',','),tooltip('properties.rank','Busiest-square rank'),tooltip('properties.latitude','Latitude'),tooltip('properties.longitude','Longitude')]},
    },{data:{values:cells},transform:[{filter:lit}],mark:{type:'geoshape',fill:null,stroke:C.ink,strokeWidth:1.1}},
    outline(D),
    ...haloText(cities,{fontSize:11,fontWeight:600,dy:15}),
    // The running headline on the map itself: how many squares the chosen share needs.
    {data:{values:D.grid},transform:[{filter:'datum.cumBefore < cover'},{aggregate:[{op:'count',as:'n'}]},
      {calculate:"datum.n+' of '+"+D.grid.length+"+' squares'",as:'line1'},
      {calculate:"cover>=1?'hold every record':'hold '+format(cover,'.0%')+' of all records'",as:'line2'}],
      layer:[{mark:{type:'text',align:'left',baseline:'top',fontSize:small?20:28,fontWeight:600,font:'Literata',color:C.green,x:0,y:0},encoding:{text:{field:'line1'}}},
        {mark:{type:'text',align:'left',baseline:'top',fontSize:small?12:14,color:C.ink,x:1,y:small?26:36},encoding:{text:{field:'line2'}}}]},
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

function alluvial(D,w) {
  const narrow=w<600, width=w-16, H=narrow?440:400;
  const left=narrow?108:150, right=narrow?width-74:width-144;
  const sourceNames=['eBird Australia','BirdLife Australia, Birdata','iNaturalist Australia'];
  const sourceShort={'eBird Australia':'eBird','BirdLife Australia, Birdata':'Birdata','iNaturalist Australia':'iNaturalist'};
  const states=[...D.states].sort((a,b)=>b.count-a.count);
  const total=D.insights.total, unit=(H-112)/total;
  let cursor=32;const ends={}; const nodes=[];
  for (const s of states) {ends[s.state]={y:cursor,offset:cursor};
    const shares=Object.fromEntries(sourceNames.map(n=>[n,(D.flows.find(f=>f.source===n&&f.state===s.state)||{count:0}).count/s.count]));
    nodes.push({side:'right',name:s.code,label:s.state,count:s.count,shares,y0:cursor,y1:cursor+s.count*unit});cursor+=s.count*unit+11;}
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
    links.push({...f,stateShare:f.count/s.count,path:`M${left},${sy0}C${mid},${sy0} ${mid},${ty0} ${right},${ty0}L${right},${ty0+delta}C${mid},${ty0+delta} ${mid},${sy0+delta} ${left},${sy0+delta}Z`});
  }
  // The four smallest states occupy barely 13px of ribbon each, so their two-line
  // labels would overprint their neighbours. Push the labels apart to a minimum
  // spacing and draw a leader back to the node whenever one has been displaced.
  // A label is a 14px name on one line and an 11px percentage 17px below it, so the
  // spacing has to clear roughly 31px or the percentage runs into the next name.
  const lineGap=34;
  const stacked=nodes.filter(n=>n.side==='right').sort((a,b)=>a.y0-b.y0);
  for(const n of stacked) n.labelY=(n.y0+n.y1)/2;
  for(let i=1;i<stacked.length;i++)
    stacked[i].labelY=Math.max(stacked[i].labelY,stacked[i-1].labelY+lineGap);
  const spill=stacked.length?stacked[stacked.length-1].labelY-(H-16):0;
  if(spill>0) for(let i=stacked.length-1;i>=0;i--)
    stacked[i].labelY=Math.min(stacked[i].labelY,H-16-(stacked.length-1-i)*lineGap);
  for(const n of nodes) if(n.side!=='right') n.labelY=(n.y0+n.y1)/2;
  const leaders=stacked.filter(n=>Math.abs(n.labelY-(n.y0+n.y1)/2)>1.5)
    .map(n=>({y:(n.y0+n.y1)/2,labelY:n.labelY}));
  return V(width,H,{description:'An alluvial diagram showing how records from three citizen-science datasets are distributed across states. Ribbon thickness is proportional to record count. These are not migration paths.',
    data:[{name:'links',values:links},{name:'nodes',values:nodes},{name:'leaders',values:leaders}],
    // One source is picked at a time and drawn in ochre, the journal's colour for the
    // reader's choice; the rest stay neutral so no platform borrows the volume green.
    signals:[{name:'source',value:'BirdLife Australia, Birdata',on:[{events:'@ribbon:click, @node:click',update:'datum.source||source'}]}],
    marks:[{type:'path',name:'ribbon',from:{data:'links'},encode:{enter:{path:{field:'path'},cursor:{value:'pointer'},
      tooltip:{signal:"{'Dataset':datum.source,'State':datum.state,'Records':format(datum.count,','),'Share of the state':format(datum.stateShare,'.1%')}"}},
      update:{fill:{signal:`datum.source===source?'${C.ochre}':'#aeb3a5'`},fillOpacity:{signal:'datum.source===source?.8:.32'}},hover:{fillOpacity:{value:.95}}}},
      {type:'rect',name:'node',from:{data:'nodes'},encode:{enter:{x:{signal:`datum.side==='left'?${left-6}:${right}`},width:{value:6},y:{field:'y0'},y2:{field:'y1'},cursor:{signal:"datum.side==='left'?'pointer':'default'"},
        tooltip:{signal:"{'Name':datum.label,'Records':format(datum.count,',')}"}},update:{fill:{signal:`datum.side==='left'&&datum.source===source?'${C.ochre}':'${C.ink}'`}}}},
      {type:'rule',from:{data:'leaders'},encode:{enter:{x:{value:right+6},x2:{value:right+11},y:{field:'y'},y2:{field:'labelY'},
        stroke:{value:C.rule},strokeWidth:{value:1}}}},
      {type:'text',from:{data:'nodes'},encode:{enter:{x:{signal:`datum.side==='left'?${left-14}:${right+13}`},y:{signal:'datum.labelY-6'},
        text:{field:'name'},align:{signal:"datum.side==='left'?'right':'left'"},fontSize:{value:narrow?12:14},fontWeight:{value:500}}}},
      {type:'text',from:{data:'nodes'},encode:{enter:{x:{signal:`datum.side==='left'?${left-14}:${right+13}`},y:{signal:'datum.labelY+11'},
        align:{signal:"datum.side==='left'?'right':'left'"},fontSize:{value:11}},
        // Right-hand figures answer the chart's question for the chosen source: what
        // share of each state's records it supplies.
        update:{text:{signal:"datum.side==='left'?format(datum.count/"+total+",'.1%')+' of all':format(datum.shares[source],'.0%')+' '+"+JSON.stringify(sourceShort)+"[source]"},
          fill:{signal:`datum.side==='right'?'${C.ochreText}':'${C.muted}'`},fontWeight:{signal:"datum.side==='right'?600:400"}}}},
    ]});
}

function treemap(D,w) {
  const width=w-16,H=w<600?430:380;
  // Every family that can reach this chart needs an English name; a Latin name in a
  // block is jargon the audience note rules out. Blocks get the short name because
  // a rectangle this size clips anything longer, and the tooltip carries the full
  // name and the scientific one.
  const friendly={Meliphagidae:['Honeyeaters','Honeyeaters'],Artamidae:['Magpies','Magpies, butcherbirds & woodswallows'],
    Psittacidae:['Parrots','Parrots & lorikeets'],Anatidae:['Ducks','Ducks, geese & swans'],
    Columbidae:['Pigeons','Pigeons & doves'],Cacatuidae:['Cockatoos','Cockatoos'],
    Acanthizidae:['Thornbills','Thornbills & allies'],Rhipiduridae:['Fantails','Fantails'],
    Rallidae:['Rails','Rails, crakes & coots'],Corvidae:['Crows','Crows & ravens'],
    Ardeidae:['Herons','Herons, egrets & bitterns'],Phalacrocoracidae:['Cormorants','Cormorants'],
    Monarchidae:['Monarchs','Monarch flycatchers'],Accipitridae:['Hawks','Hawks, eagles & kites'],
    Pachycephalidae:['Whistlers','Whistlers & allies'],Maluridae:['Fairy-wrens','Fairy-wrens'],
    Hirundinidae:['Swallows','Swallows & martins'],Campephagidae:['Cuckoo-shrikes','Cuckoo-shrikes'],
    Charadriidae:['Plovers','Plovers & lapwings'],Scolopacidae:['Sandpipers','Sandpipers & allies'],
    Petroicidae:['Robins','Australian robins'],Estrildidae:['Finches','Grassfinches'],
    Laridae:['Gulls','Gulls & terns'],Halcyonidae:['Kingfishers','Tree kingfishers'],
    Pardalotidae:['Pardalotes','Pardalotes']};
  // Rectangle area and fill lightness both encode record count. Redundant encoding
  // on one ordered attribute, rather than an ordinal palette that would repeat hues
  // and imply a kinship between families that share one.
  // The remainder block is context, not a family: it stays neutral and outside the
  // ramp, or the biggest, darkest block on the chart would be the least meaningful.
  const isOther=r=>r.family.startsWith('Other');
  const named=D.families.filter(r=>!isOther(r)).slice(0,10), rest=D.families.filter(r=>!named.includes(r));
  const families=[...named,{family:'Other families / unassigned',count:rest.reduce((n,r)=>n+r.count,0),share:rest.reduce((n,r)=>n+r.share,0)}];
  const counts=named.map(r=>r.count), lo=Math.min(...counts), hi=Math.max(...counts);
  const plot=H-44, labelSize=w<500?11:12;
  const vals=[{id:'root',parent:null,count:0},...families.map((r,i)=>({...r,id:r.family,parent:'root',rank:i,
    other:isOther(r),label:isOther(r)?'All other families':(friendly[r.family]||[r.family])[0],longLabel:isOther(r)?'All other families and unassigned records':(friendly[r.family]||[r.family,r.family])[1],
    onDark:!isOther(r)&&Math.log(r.count/lo)/Math.log(hi/lo)>.72}))];
  return V(width,H,{description:'Treemap of the fifteen most-recorded bird families and the remainder. Rectangle area and colour lightness both encode records, not species richness.',
    data:[{name:'tree',values:vals,transform:[{type:'stratify',key:'id',parentKey:'parent'},
      {type:'treemap',field:'count',sort:{field:'value',order:'descending'},method:'squarify',ratio:1.35,size:[width,plot],paddingInner:4}]},
      {name:'leaves',source:'tree',transform:[{type:'filter',expr:'datum.depth===1'}]}],
    scales:[{name:'fill',type:'log',domain:[lo,hi],range:[CB.greens[0],CB.greens[4]]}],
    marks:[{type:'rect',from:{data:'leaves'},encode:{enter:{x:{field:'x0'},x2:{field:'x1'},y:{field:'y0'},y2:{field:'y1'},
      fill:{signal:"datum.other?'#efebe0':scale('fill',datum.count)"},stroke:{signal:"datum.other?'#b9b4a4':null"},strokeDash:{value:[3,3]},
      tooltip:{signal:"{'Family':datum.longLabel,'Scientific family':datum.family,'Records':format(datum.count,','),'Share':format(datum.share,'.1%')}"}},
      update:{strokeWidth:{value:1}},hover:{strokeWidth:{value:2}}}},
      {type:'text',from:{data:'leaves'},encode:{enter:{x:{signal:'datum.x0+12'},y:{signal:'datum.y0+22'},text:{field:'label'},
        fill:{signal:"datum.onDark?'#fffdf5':'#292e27'"},fontSize:{value:labelSize},fontWeight:{value:500},limit:{signal:'datum.x1-datum.x0-20'},
        // A clipped word reads worse than no word, and the tooltip carries the full
        // name either way, so hide the label unless the block is wide enough for it.
        opacity:{signal:`datum.x1-datum.x0 > length(datum.label)*${labelSize*0.58}+22 && datum.y1-datum.y0>42?1:0`}}}},
      {type:'text',from:{data:'leaves'},encode:{enter:{x:{signal:'datum.x0+12'},y:{signal:'datum.y0+42'},text:{signal:"format(datum.share,'.1%')"},
        fill:{signal:"datum.onDark?'#fffdf5':'#292e27'"},fontSize:{value:11},opacity:{signal:`datum.x1-datum.x0 > length(datum.label)*${labelSize*0.58}+22 && datum.y1-datum.y0>48?1:0`}}}},
    ],
    // Legend values must sit inside the scale domain or Vega drops them, and the
    // smallest family here still holds about 230,000 records.
    legends:[{fill:'fill',type:'gradient',direction:'horizontal',orient:'none',legendX:0,legendY:plot+14,
      title:'Records per family',titleLimit:width,values:[300000,500000,1000000],format:'.1~s',
      gradientLength:Math.min(240,width-40),gradientThickness:9}]});
}

function seasonalClock(D,w) {
  // The dial grows with the column. Month labels sit at radius+24, so leave
  // room for them on both sides rather than capping the dial at a fixed size.
  const width=w-16, radius=Math.max(140,Math.min(320,(width-104)/2)), H=radius*2+86, cx=width/2,cy=H/2;
  const codes=['NT','QLD','WA','SA','NSW','ACT','VIC','TAS'];
  const inner=38,band=(radius-inner)/8, gap=.64,step=(Math.PI*2-gap)/12;
  const vals=D.stateMonth.map(r=>({...r,a0:gap/2+(r.month-1)*step+.012,a1:gap/2+r.month*step-.012,
    r0:inner+codes.indexOf(r.code)*band+1,r1:inner+(codes.indexOf(r.code)+1)*band-1}));
  const labels=MONTHS.map((label,i)=>({label,angle:gap/2+(i+.5)*step,peak:label===D.insights.peakMonth}));
  return V(width,H,{description:'Circular heatmap of monthly records per day relative to each state’s annual daily average. Rings show states from north to south; sectors follow the calendar.',
    data:[{name:'cells',values:vals},{name:'months',values:labels},
      {name:'rings',values:codes.map((code,i)=>({code,r:inner+(i+.5)*band}))}],
    scales:[{name:'pace',type:'linear',domain:[.5,1,1.6],range:[CB.brbg[0],CB.brbg[2],CB.brbg[4]],clamp:true}],
    marks:[{type:'arc',from:{data:'cells'},encode:{enter:{x:{value:cx},y:{value:cy},startAngle:{field:'a0'},endAngle:{field:'a1'},innerRadius:{field:'r0'},outerRadius:{field:'r1'},
      fill:{scale:'pace',field:'dailyIndex'},tooltip:{signal:"{'State':datum.state,'Month':datum.label,'Records':format(datum.count,','),'Daily pace vs state average':format(datum.dailyIndex,'.2f')+'×'}"}},
      update:{strokeWidth:{value:0}},hover:{stroke:{value:C.ink},strokeWidth:{value:1.4}}}},
      {type:'text',from:{data:'months'},encode:{enter:{x:{signal:`${cx}+sin(datum.angle)*(datum.peak?${radius+12}:${radius+24})`},y:{signal:`${cy}-cos(datum.angle)*${radius+24}`},
        text:{signal:"datum.peak?[datum.label,'busiest month']:datum.label"},align:{signal:"datum.peak?(sin(datum.angle)<0?'right':'left'):'center'"},baseline:{value:'middle'},
        fontSize:{signal:'datum.peak?13:12'},fontWeight:{signal:'datum.peak?700:400'},fill:{signal:`datum.peak?'${C.green}':'${C.ink}'`}}}},
      {type:'text',from:{data:'rings'},encode:{enter:{x:{value:cx},y:{signal:`${cy}-datum.r`},text:{field:'code'},align:{value:'center'},baseline:{value:'middle'},fontSize:{value:w<450?9:11},fill:{value:C.muted}}}},
      {type:'text',encode:{enter:{x:{value:cx},y:{value:cy-3},text:{value:'2024'},align:{value:'center'},fontSize:{value:17},fontWeight:{value:500}}}},
      {type:'text',encode:{enter:{x:{value:cx},y:{value:cy+14},text:{value:'daily pace'},align:{value:'center'},fontSize:{value:9},fill:{value:C.muted}}}},
    ],legends:[{fill:'pace',type:'gradient',direction:'horizontal',orient:'none',legendX:cx-110,legendY:H-6,title:'Compared with each state’s daily average',titleLimit:width-40,titleAnchor:'middle',values:[.5,1,1.6],format:'.1f',gradientLength:220,gradientThickness:9}]});
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
  const base={x:{field:'month',type:'ordinal',sort:'ascending',axis:{title:null,labelAngle:0,labelExpr:"['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][datum.value-1]"}},
    y:{field:'rank',type:'quantitative',scale:{domain:[1,max],reverse:true,zero:false},axis:{title:'Most recorded → lower rank',tickCount:Math.min(max,10),format:'d'}}};
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
      // The default view's finding, written on the line it describes.
      {data:{values:[{month:6,rank:8,text:'8th in June, 2nd by September'}]},transform:[{filter:"highlight==='Welcome Swallow'"}],
        mark:{type:'text',align:'left',dx:10,dy:14,fontSize:12,fontWeight:600,color:C.ochreText},encoding:{x:base.x,y:base.y,text:{field:'text'}}},
      {data:{values:end},transform:[{filter:'!('+picked+')'}],
        mark:{type:'text',align:'left',dx:13,fontSize:compact?10:11,color:C.muted},encoding:{...base,text:{field:'name'}}},
      {data:{values:end},transform:[{filter:picked}],
        mark:{type:'text',align:'left',dx:13,fontSize:compact?10:11,fontWeight:700,color:C.ochreText},encoding:{...base,text:{field:'name'}}},
    ]});
}

function beeMap(D,w) {
  const max=Math.max(...D.beeMap.map(r=>r.count)), small=w<560;
  // The opposite season stays on the map as hollow rings, so the comparison never
  // depends on remembering a previous frame.
  const opposite="{'Summer':'Winter','Winter':'Summer','Autumn':'Spring','Spring':'Autumn'}[season]";
  const size={field:'count',type:'quantitative',scale:{domain:[0,max],range:[0,small?450:760]},legend:{title:'Bee-eater records',orient:'bottom',direction:'horizontal',values:[100,500,1000],symbolFillColor:'#d9bd90',symbolStrokeColor:'#9b6a26',symbolStrokeWidth:1,symbolOpacity:1}};
  const colour={field:'season',type:'nominal',scale:{domain:SEASONS,range:C.seasons},legend:null};
  const tip=[tooltip('season','Season'),tooltip('count','Bee-eater records',','),tooltip('latitude','Latitude'),tooltip('longitude','Longitude')];
  return VL(w-16,mapH(w),{description:'Proportional-symbol map of rainbow bee-eater records in one-degree squares for the chosen season, with the opposite season drawn as hollow rings. Circle area represents count, on one fixed scale.',
    params:[{name:'season',value:'Summer'}],projection,layer:[baseMap(D),
      {data:{values:D.beeMap},transform:[{filter:`datum.season===${opposite}`}],mark:{type:'circle',filled:false,strokeWidth:1.1,opacity:.75},encoding:{longitude:LON,latitude:LAT,size,color:colour,tooltip:tip}},
      {data:{values:D.beeMap},transform:[{filter:'datum.season===season'}],mark:{type:'circle',opacity:.78,stroke:C.paper,strokeWidth:.6},encoding:{longitude:LON,latitude:LAT,size,color:colour,tooltip:tip}},
      {data:{values:[{longitude:112,latitude:-30},{longitude:154,latitude:-30}]},mark:{type:'line',strokeDash:[4,5],color:C.ink,strokeWidth:1},encoding:{longitude:LON,latitude:LAT}},
      // The finding, recomputed for whichever season is showing, printed beside the line.
      {data:{values:D.beeMonth},transform:[{filter:'datum.season===season'},
        {aggregate:[{op:'sum',field:'southOf30',as:'south'},{op:'sum',field:'count',as:'n'}]},
        {calculate:"format(datum.south/datum.n,'.0%')",as:'share'},{calculate:"'of '+lower(season)+' records'",as:'what'},
        {calculate:'112.3',as:'longitude'},{calculate:'-30',as:'latitude'}],
        layer:[{mark:{type:'text',align:'left',baseline:'top',dy:9,fontSize:small?22:30,fontWeight:500,font:'Literata',color:C.ink,stroke:C.paper,strokeWidth:4},encoding:{longitude:LON,latitude:LAT,text:{field:'share'}}},
          {mark:{type:'text',align:'left',baseline:'top',dy:9,fontSize:small?22:30,fontWeight:500,font:'Literata',color:C.ink},encoding:{longitude:LON,latitude:LAT,text:{field:'share'}}},
          {mark:{type:'text',align:'left',baseline:'top',dy:small?35:45,fontSize:12,color:C.ink,stroke:C.paper,strokeWidth:4},encoding:{longitude:LON,latitude:LAT,text:{field:'what'}}},
          {mark:{type:'text',align:'left',baseline:'top',dy:small?35:45,fontSize:12,color:C.ink},encoding:{longitude:LON,latitude:LAT,text:{field:'what'}}},
          {mark:{type:'text',align:'left',baseline:'top',dy:small?50:60,fontSize:12,color:C.muted},encoding:{longitude:LON,latitude:LAT,text:{value:'lie south of 30°S ↓'}}}]},
    ]});
}

function seasonField(D,w) {
  // Filled isolines of a smoothed field: where does a place's share of winter records
  // outweigh its share of summer records? The two seasons keep their own hues, and
  // lightness carries strength, so the pale middle band means no seasonal lean.
  const bands=['Much busier in summer','Busier in summer','About even','Busier in winter','Much busier in winter'];
  const small=w<560;
  return VL(w-16,mapH(w),{description:'Filled contour map of a smoothed field: for each place, its share of all winter (June–August) records divided by its share of all summer (December–February) records, 2024. Toggle between all bird records and rainbow bee-eater records. Blank land has too few records to estimate.',
    params:[{name:'who',value:'Everyone'}],projection,layer:[{data:{values:D.australia.features},mark:{type:'geoshape',fill:'#d6d2c6',stroke:'#c7c6b8',strokeWidth:.7}},
      {data:{values:D.seasonField.features},transform:[{filter:'datum.properties.who===who'}],mark:{type:'geoshape',strokeWidth:0},
        encoding:{color:{field:'properties.label',type:'ordinal',scale:{domain:bands,range:CB.brbg},
          legend:{title:null,orient:'bottom',direction:'horizontal',columns:small?2:5,symbolType:'square',symbolSize:160,labelLimit:200,columnPadding:14}},
          tooltip:[tooltip('properties.label','Seasonal lean')]}},
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
    axes:[{orient:'bottom',scale:'x',values:[-40,-35,-30,-25,-20,-15,-10],title:'← Southern Australia                  Northern Australia →',
      encode:{labels:{update:{text:{signal:"abs(datum.value)+'°S'"}}}}}],
    marks:[{type:'rule',encode:{enter:{x:{scale:'x',value:-30},y:{value:0},y2:{value:H-20},stroke:{value:C.muted},strokeDash:{value:[3,5]},strokeOpacity:{value:.5}}}},
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
  // because it relocates within Australia rather than leaving (Figs 7–9).
  const groups={
    'Share swings with the seasons':['White-throated Needletail','Eastern Koel','Red-necked Stint'],
    'Share steady all year':['Rainbow Bee-eater','Silvereye','Welcome Swallow','Superb Fairy-wren','Australian Magpie'],
  };
  const order=Object.keys(groups);
  const group=new Map(order.flatMap(g=>groups[g].map(name=>[name,g])));
  const rows=D.speciesMonth.filter(r=>group.has(r.name)).map(r=>({...r,group:group.get(r.name)}));
  const compact=w<500, width=w-(compact?146:225);
  return {$schema:'https://vega.github.io/schema/vega-lite/v5.json',padding:8,config,
    description:'Monthly share of all records for eight featured species, divided by each species’ annual share. One means the species occupies its typical share. Rows are grouped into birds whose share swings through the year and birds recorded steadily all year. This adjusts for total monthly record volume, not survey effort.',
    data:{values:rows},spacing:30,resolve:{scale:{y:'independent'}},
    facet:{row:{field:'group',type:'nominal',sort:order,title:null,
      header:{labelAngle:0,labelAlign:'left',labelAnchor:'start',labelOrient:'top',labelPadding:6,
        labelFontSize:compact?11:13,labelFontWeight:600,labelColor:C.ink,labelFont:FONT}}},
    spec:{width:Math.max(180,Math.round(width)),height:{step:compact?26:32},
      mark:{type:'rect',stroke:C.paper,strokeWidth:2,cornerRadius:1},
      encoding:{x:{field:'label',type:'ordinal',sort:MONTHS,axis:{title:null,labelAngle:0}},
        y:{field:'name',type:'ordinal',sort:order.flatMap(g=>groups[g]),axis:{title:null,labelLimit:compact?130:210,labelFontSize:compact?10:12}},
        color:{field:'relative',type:'quantitative',scale:{type:'log',domain:[.25,1,4],range:[CB.brbg[0],CB.brbg[2],CB.brbg[4]],clamp:true},
          legend:{title:'Share relative to annual share',titleLimit:280,orient:'bottom',values:[.25,1,4],format:'.2~f',gradientLength:180}},
        tooltip:[tooltip('name','Bird'),tooltip('label','Month'),tooltip('count','Records',','),tooltip('per10k','Per 10,000 bird records','.1f'),tooltip('relative','Relative to annual share','.2f')]}}};
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
      {name:'color',type:'ordinal',domain:statuses,range:CB.orrd}],
    axes:[{scale:'x',orient:'bottom',values:[1,10,100,1000,10000],format:',',title:'2024 records per species · logarithmic scale',grid:true}],
    marks:[{type:'rule',from:{data:'statuses'},encode:{enter:{x:{value:0},x2:{signal:'width'},y:{field:'y'},stroke:{value:C.rule},strokeWidth:{value:.7}}}},
      {type:'text',from:{data:'statuses'},encode:{enter:{x:{value:0},y:{signal:'datum.y-36'},text:{field:'status'},fontSize:{value:12},fontWeight:{value:600},fill:{value:C.ink}}}},
      {type:'symbol',from:{data:'birds'},encode:{enter:{x:{scale:'x',field:'count'},y:{signal:"48+indexof(['Vulnerable','Endangered','Critically Endangered'],datum.status)*100+datum.offset"},
        size:{value:73},fill:{scale:'color',field:'status'},stroke:{value:C.paper},strokeWidth:{value:1},
        tooltip:{signal:"{'Bird':datum.name,'Scientific name':datum.scientific,'Listing in Aug 2026':datum.status,'2024 records':format(datum.count,',')}"}},
        update:{size:{value:73}},hover:{size:{value:145},stroke:{value:C.ink}}}},
    ]});
}

const vegaProjection={name:'projection',type:'conicEqualArea',parallels:[-18,-36],rotate:[-134,0,0],center:[0,-28],
  fit:{signal:"data('states')"},size:{signal:'[width,height]'}};

function spikeMap(D,w) {
  // Spike length is a rate: threatened-bird records per 1,000 of all records in the
  // square, so busy squares cannot win on volume alone. One fixed length scale serves
  // every filter, so switching groups compares like with like.
  const width=w-16,H=mapH(w),small=w<560,top=H*.3;
  const notes=[
    {text:'Albatross boat trips off Sydney',longitude:152,latitude:-34,groups:['All','Seabirds'],dx:12,dy:-4,align:'left'},
    {text:'Albatross trips off Albany',longitude:120,latitude:-35,groups:['Seabirds'],dx:-10,dy:16,align:'right'},
    {text:'Albany: rare scrub-birds',longitude:119,latitude:-35,groups:['All','Land birds'],dx:-10,dy:16,align:'right'},
    {text:'Kimberley and Darwin mudflats',longitude:124,latitude:-15,groups:['All','Shorebirds & wetland birds'],dx:-10,dy:-8,align:'right'},
    {text:'Broome: migratory shorebirds',longitude:122,latitude:-18,groups:['Shorebirds & wetland birds'],dx:-10,dy:12,align:'right'},
    {text:'Tasmanian pelagic trips',longitude:148,latitude:-43,groups:['Seabirds'],dx:12,dy:6,align:'left'},
    {text:'Carpentarian Grasswren country',longitude:139,latitude:-20,groups:['Land birds'],dx:12,dy:0,align:'left'},
  ].filter(n=>!small||n.groups.includes('All'));
  return V(width,H,{description:'Spike map. Each spike stands on a one-degree square; its height is threatened-bird records per 1,000 of all bird records there in 2024. Squares with fewer than 300 records are omitted. A control filters by kind of bird.',
    signals:[{name:'group',value:'All'}],
    projections:[vegaProjection],
    data:[{name:'states',values:D.australia.features},
      {name:'spikes',values:D.threatenedGrid,transform:[{type:'filter',expr:"group==='All' || datum.group===group"},
        {type:'aggregate',groupby:['latitude','longitude','records','topAll'],fields:['threatened','threatened'],ops:['sum','argmax'],as:['threatened','biggest']},
        {type:'formula',expr:"group==='All'?datum.topAll:datum.biggest.top",as:'top'},
        {type:'formula',expr:'1000*datum.threatened/datum.records',as:'rate'},
        {type:'formula',expr:"scale('projection',[datum.longitude,datum.latitude])",as:'xy'},
        {type:'collect',sort:{field:'latitude',order:'descending'}}]},
      {name:'notes',values:notes,transform:[{type:'filter',expr:'indexof(datum.groups,group)>=0'},
        {type:'formula',expr:"scale('projection',[datum.longitude,datum.latitude])",as:'xy'}]},
      {name:'key',values:[{rate:100}]}],
    scales:[{name:'h',type:'linear',domain:[0,340],range:[0,top],zero:true}],
    marks:[{type:'shape',from:{data:'states'},encode:{enter:{fill:{value:'#e8e4d9'},stroke:{value:'#c7c6b8'},strokeWidth:{value:.7}}},transform:[{type:'geoshape',projection:'projection'}]},
      {type:'path',from:{data:'spikes'},encode:{update:{x:{signal:'datum.xy[0]'},y:{signal:'datum.xy[1]'},
        path:{signal:`'M-${small?2.2:3.6},0L0,'+(-max(1.5,scale('h',datum.rate)))+'L${small?2.2:3.6},0Z'`},
        fill:{value:C.rust},fillOpacity:{signal:'datum.rate<40?.22:.6'},stroke:{value:C.rust},strokeOpacity:{signal:'datum.rate<40?.35:1'},strokeWidth:{value:.8},
        tooltip:{signal:"{'Square':abs(datum.latitude)+'°S, '+datum.longitude+'°E','Threatened-bird records per 1,000':format(datum.rate,'.0f'),'Threatened-bird records':format(datum.threatened,','),'All bird records':format(datum.records,','),'Most recorded threatened bird':datum.top}"}},
        hover:{fillOpacity:{value:.95},strokeOpacity:{value:1}}}},
      {type:'rule',from:{data:'notes'},encode:{update:{x:{signal:'datum.xy[0]'},y:{signal:"datum.xy[1]"},x2:{signal:'datum.xy[0]+datum.dx*.8'},y2:{signal:'datum.xy[1]+datum.dy*.8'},stroke:{value:C.ink},strokeWidth:{value:.7}}}},
      ...['halo','ink'].map(k=>({type:'text',from:{data:'notes'},encode:{update:{x:{signal:'datum.xy[0]+datum.dx'},y:{signal:'datum.xy[1]+datum.dy'},text:{field:'text'},align:{field:'align'},baseline:{value:'middle'},
        fontSize:{value:small?11:12},fontWeight:{value:600},fill:{value:C.ink},...(k==='halo'?{stroke:{value:C.paper},strokeWidth:{value:4},strokeJoin:{value:'round'}}:{})}}})),
      // Length key, bottom left: one spike at 100 per 1,000.
      {type:'path',from:{data:'key'},encode:{update:{x:{value:18},y:{signal:'height-6'},path:{signal:"'M-3.6,0L0,'+(-scale('h',100))+'L3.6,0Z'"},fill:{value:C.rust},fillOpacity:{value:.5},stroke:{value:C.rust}}}},
      {type:'text',encode:{update:{x:{value:30},y:{signal:"height-10-scale('h',100)/2"},text:{value:['100 threatened-bird records','per 1,000 records'],},fontSize:{value:11},fill:{value:C.muted},baseline:{value:'middle'}}}},
    ]});
}

function stateCircles(D,w) {
  // Dorling cartogram: every jurisdiction becomes a circle at its own location, area
  // proportional to the chosen measure, nudged apart by a collision force. Switching
  // measures re-runs the layout, so the circles visibly swell and shrink in place.
  const width=w-16,H=Math.min(470,Math.max(330,width*.8)),R=Math.min(width,H)*.15;
  const maxRecords=Math.max(...D.states.map(s=>s.count)),maxListed=Math.max(...D.states.map(s=>s.listed));
  return V(width,H,{description:'Dorling cartogram of the eight states and territories. Circle area is proportional to either 2024 bird records or the number of nationally listed threatened bird taxa associated with the jurisdiction. Select a circle to highlight its combinations in the overlap chart.',
    signals:[{name:'measure',value:'listed'},
      {name:'picked',value:'',on:[{events:'symbol:click',update:"picked===datum.code?'':datum.code"},{events:'dblclick',update:"''"}]}],
    projections:[vegaProjection],
    data:[{name:'states',values:D.australia.features},
      {name:'nodes',values:D.states.map(s=>({code:s.code,state:s.state,count:s.count,listed:s.listed,longitude:s.longitude,latitude:s.latitude})),
        transform:[{type:'formula',expr:`measure==='listed'?datum.listed/${maxListed}:datum.count/${maxRecords}`,as:'t'},
          {type:'formula',expr:`max(9,sqrt(datum.t)*${R})`,as:'r'},
          // The other measure, drawn as a ring on the same centre, so both halves of
          // the headline are visible before the toggle is touched.
          {type:'formula',expr:`max(4,sqrt(measure==='listed'?datum.count/${maxRecords}:datum.listed/${maxListed})*${R})`,as:'r2'},
          {type:'formula',expr:"scale('projection',[datum.longitude,datum.latitude])[0]",as:'tx'},
          {type:'formula',expr:"scale('projection',[datum.longitude,datum.latitude])[1]",as:'ty'},
          {type:'formula',expr:'datum.tx',as:'x'},{type:'formula',expr:'datum.ty',as:'y'},
          // alpha differs per measure only so that switching measure changes a force
          // parameter, which is what makes Vega restart the simulation.
          {type:'force',static:false,iterations:300,alphaMin:.005,alpha:{signal:"measure==='listed'?1:.999"},forces:[{force:'collide',radius:{expr:'max(datum.r,datum.r2)+3'},strength:1,iterations:6},
            {force:'x',x:'tx',strength:.05},{force:'y',y:'ty',strength:.05}]},
          // Keep every circle inside the frame once the layout settles.
          {type:'formula',expr:'clamp(datum.x,max(datum.r,datum.r2)+2,width-max(datum.r,datum.r2)-2)',as:'x'},{type:'formula',expr:'clamp(datum.y,max(datum.r,datum.r2)+16,height-max(datum.r,datum.r2)-2)',as:'y'}]}],
    marks:[{type:'shape',from:{data:'states'},encode:{enter:{fill:{value:'#ebe7dc'},stroke:{value:'#d5d0c1'},strokeWidth:{value:.7}}},transform:[{type:'geoshape',projection:'projection'}]},
      {type:'symbol',from:{data:'nodes'},encode:{update:{x:{field:'x'},y:{field:'y'},size:{signal:'PI*datum.r*datum.r'},cursor:{value:'pointer'},
        fill:{signal:`measure==='listed'?'${C.rust}':'${C.green}'`},fillOpacity:{signal:"picked===''||picked===datum.code?.88:.3"},
        stroke:{signal:`picked===datum.code?'${C.ink}':'${C.paper}'`},strokeWidth:{signal:'picked===datum.code?2.5:1.5'},
        tooltip:{signal:"{'Jurisdiction':datum.state,'2024 bird records':format(datum.count,','),'Listed threatened bird taxa':datum.listed}"}}}},
      {type:'symbol',from:{data:'nodes'},interactive:false,encode:{update:{x:{field:'x'},y:{field:'y'},size:{signal:'PI*datum.r2*datum.r2'},fill:{value:'transparent'},
        stroke:{signal:`measure==='listed'?'${C.green}':'${C.rust}'`},strokeWidth:{value:2},strokeDash:{value:[4,3]},
        strokeOpacity:{signal:"picked===''||picked===datum.code?1:.3"}}}},
      // Ink on a paper halo stays readable on any circle, faded or not.
      ...['halo','ink'].flatMap(k=>{const halo=k==='halo'?{stroke:{value:C.paper},strokeWidth:{value:3.5},strokeJoin:{value:'round'}}:{};return [
        {type:'text',from:{data:'nodes'},interactive:false,encode:{update:{x:{field:'x'},y:{signal:'datum.r>24?datum.y-4:datum.y-datum.r-14'},text:{field:'code'},align:{value:'center'},baseline:{value:'middle'},
          fontSize:{value:12},fontWeight:{value:700},fill:{value:C.ink},...halo}}},
        {type:'text',from:{data:'nodes'},interactive:false,encode:{update:{x:{field:'x'},y:{signal:'datum.r>24?datum.y+11:datum.y-datum.r-2'},align:{value:'center'},baseline:{value:'middle'},
          text:{signal:"measure==='listed'?datum.listed+'':format(datum.count/1e6,'.1f')+'M'"},fontSize:{value:11},fill:{value:C.ink},...halo}}}];}),
    ]});
}

function upset(D,w) {
  const width=w-66,H=390,codes=['WA','NT','SA','QLD','NSW','VIC','TAS','ACT'];
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
      {name:'y',type:'linear',domain:[0,Math.max(...bars.map(r=>r.count))*1.45],range:[140,0],zero:true}],
    marks:[{type:'rect',from:{data:'codes'},encode:{update:{x:{value:-40},x2:{signal:'width'},y:{signal:'178+datum.row*27-12'},height:{value:24},fill:{value:'#efe3dc'},opacity:{signal:'picked===datum.code?1:0'}}}},
      {type:'rect',from:{data:'bars'},encode:{enter:{x:{scale:'x',field:'id'},width:{scale:'x',band:1},y:{scale:'y',field:'count'},y2:{value:140},
      tooltip:{signal:"{'Exactly these states':datum.combination,'Listed bird taxa':datum.count}"}},update:{fill:{signal:`${on}?'${C.rust}':'#e6d8d2'`}}}},
      {type:'text',from:{data:'bars'},encode:{enter:{x:{scale:'x',field:'id',band:.5},y:{scale:'y',field:'count',offset:-7},text:{field:'count'},align:{value:'center'},fontSize:{value:12},fontWeight:{value:600}},
        update:{fill:{signal:`${on}?'${C.ink}':'${C.muted}'`}}}},
      // Two worked examples, so the matrix can be decoded from the chart itself.
      {type:'text',from:{data:'bars'},encode:{enter:{x:{scale:'x',field:'id',band:0},y:{scale:'y',field:'count',offset:-24},align:{value:'left'},fontSize:{value:11},fontStyle:{value:'italic'},fill:{value:C.muted},
        text:{signal:"datum.states.length===1&&datum.id===0?'only '+datum.states[0]:datum.id===1?'shared by '+datum.states.length:''"}}}},
      {type:'rule',encode:{enter:{x:{value:0},x2:{signal:'width'},y:{value:157},stroke:{value:C.rule}}}},
      {type:'rule',from:{data:'links'},encode:{enter:{x:{scale:'x',field:'id',band:.5},y:{signal:'178+datum.min*27'},y2:{signal:'178+datum.max*27'},strokeWidth:{value:1.5}},
        update:{stroke:{signal:`${on}?'${C.ink}':'#cfcabc'`}}}},
      {type:'symbol',from:{data:'matrix'},encode:{enter:{x:{scale:'x',field:'id',band:.5},y:{signal:'178+datum.row*27'},size:{value:w<500?28:54},
        tooltip:{signal:"{'Exactly these states':datum.combination,'Listed bird taxa':datum.count,'State':datum.code,'Included':datum.active?'Yes':'No'}"}},
        update:{fill:{signal:`!datum.active?'#dedace':${on}?'${C.ink}':'#cfcabc'`}}}},
      {type:'text',name:'rowlabel',from:{data:'codes'},encode:{enter:{x:{value:-12},y:{signal:'178+datum.row*27'},text:{field:'code'},align:{value:'right'},baseline:{value:'middle'},cursor:{value:'pointer'}},
        update:{fontSize:{signal:'picked===datum.code?13:11'},fontWeight:{signal:"picked===datum.code?700:400"},fill:{signal:`picked===datum.code?'${C.rust}':'${C.ink}'`}}}},
    ]});
}

function coverage(D,w) {
  const compact=w<650;
  const short={'eBird Australia':'eBird','BirdLife Australia, Birdata':'Birdata','iNaturalist Australia':'iNaturalist'};
  // The figure's question is whether a month has records at all, so colour encodes
  // exactly that; the counts live in the tooltip and the table. The gaps that matter
  // are labelled where they sit.
  const states=['Recorded','No records in snapshot','Outside comparison'];
  const labels={'Recorded':'Has records','No records in snapshot':'No records in this download','Outside comparison':'Not yet reached (after August 2026)'};
  const rows=D.coverage.map(r=>({...r,row:short[r.source]+' · '+r.year,coverage:labels[r.availability]}));
  const plotW=w-(compact?128:180), band=plotW/12;
  const notes=[{label:'Oct',row:'eBird · 2025',text:compact?'eBird stops':'eBird stops after August',dx:band/2},
    {label:'Apr',row:'eBird · 2026',text:compact?'No eBird in 2026':'No eBird records at all in 2026',dx:band/2}];
  const order=[...new Set(rows.map(r=>r.row))];
  return VL(plotW,360,{description:'Source-by-month coverage for 2024–2026. Colour marks whether a month holds records at all; exact counts are in the tooltip. Grey cells have no records in this archived snapshot, which is not the same as zero birds. Months after August 2026 are outside the comparison.',
    data:{values:rows},encoding:{x:{field:'label',type:'ordinal',sort:MONTHS,axis:{title:null,labelAngle:0,labelFontSize:compact?10:12,...(w<520?{labelExpr:'substring(datum.value,0,1)'}:{})}},
      y:{field:'row',type:'ordinal',sort:order,axis:{title:null,labelFontSize:compact?10:12,labelLimit:compact?120:170}},
      tooltip:[tooltip('source','Source'),tooltip('year','Year'),tooltip('label','Month'),tooltip('availability','Coverage'),tooltip('count','Records',',')]},
    layer:[{mark:{type:'rect',stroke:C.paper,strokeWidth:3,cornerRadius:1},
      encoding:{color:{field:'coverage',type:'nominal',sort:states.map(s=>labels[s]),
        scale:{domain:states.map(s=>labels[s]),range:[C.green,'#ddd7c6','#f2eee4']},
        legend:{title:null,orient:'bottom',direction:'horizontal',columns:compact?1:3,symbolType:'square',symbolSize:170,labelLimit:300,offset:14}}}},
      {data:{values:notes},mark:{type:'text',fontSize:compact?10:12,fontWeight:600,color:C.ink,dx:{expr:'datum.dx'}},
        encoding:{x:{field:'label',type:'ordinal',sort:MONTHS},y:{field:'row',type:'ordinal',sort:order},text:{field:'text'},tooltip:null}}],
  });
}

function recent(D,w) {
  const compact=w<680;
  // Relative change, not absolute. On a per-10,000 scale the most-recorded birds
  // win the ranking by base rate alone: the Kookaburra's −5.1 is a 2.6% shift while
  // the Silvereye's −6.2 is 10.7%. Dividing by each bird's own 2024 rate removes
  // that advantage. Green above zero and ochre below match the seasonal clock, so
  // green means more records than usual everywhere in the journal.
  const rows=D.recent;
  const y={field:'name',type:'ordinal',sort:{field:'pct',order:'descending'},axis:{title:null,labelLimit:compact?135:190,labelFontSize:compact?10:12}};
  const x={field:'pct',type:'quantitative',scale:{zero:true,nice:true},
    axis:{title:'Change relative to the bird’s own 2024 share',titleLimit:400,tickCount:5,labelExpr:"format(datum.value,'+.0f')+'%'"}};
  const hue={condition:{test:'datum.pct>=0',value:C.green},value:C.ochre};
  const tip=[tooltip('name','Bird'),tooltip('pct','Change in share','+.1f'),tooltip('rate2024','2024 per 10,000','.1f'),
    tooltip('rate2025','2025 per 10,000','.1f'),tooltip('count2024','2024 records',','),tooltip('count2025','2025 records',',')];
  const value=(test,dx,align)=>({transform:[{filter:test}],
    mark:{type:'text',dx,align,fontSize:compact?10:11,fontWeight:500},
    encoding:{y,x,text:{field:'pct',type:'quantitative',format:'+.1f'},color:{condition:{test:'datum.pct>=0',value:C.green},value:C.ochreText}}});
  return VL(w-(compact?157:220),rows.length*25,{description:'Percentage change in each featured bird’s share of all iNaturalist Australian bird records between 2024 and 2025. Every featured bird with at least 500 records in 2024 is shown. Platform-specific record share is not population change.',
    data:{values:rows},
    layer:[{data:{values:[{a:-5,b:5}]},mark:{type:'rect',color:'#ece7da'},encoding:{x:{field:'a',type:'quantitative'},x2:{field:'b'}}},
      {data:{values:[{a:0}]},mark:{type:'text',text:'within ±5%',baseline:'bottom',dy:-4,fontSize:11,color:C.muted,y:0},encoding:{x:{field:'a',type:'quantitative'}}},
      {mark:{type:'rule',color:C.rule,strokeWidth:1.2},encoding:{x:{datum:0}}},
      {mark:{type:'rule',strokeWidth:3},encoding:{y,x,x2:{datum:0},color:hue}},
      {mark:{type:'point',filled:true,size:110,stroke:C.paper,strokeWidth:1.5},encoding:{y,x,color:hue,tooltip:tip}},
      value('datum.pct>=0',11,'left'),value('datum.pct<0',-11,'right'),
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
  'season-field':seasonField,
  'threat-spikes':spikeMap,
  'state-circles':stateCircles,
  'seasonal-signatures':seasonMatrix,
  'threatened-swarm':swarm,
  'shared-responsibility':upset,
  'coverage-calendar':coverage,
  'recent-shares':recent,
};

export const chartFiles = {
  'observation-atlas':'grid', 'record-density':'states', 'record-rivers':'flows',
  'family-canopy':'families', 'seasonal-clock':'state-month', 'monthly-ranks':'rankings',
  'seasonal-footprint':'bee-map', 'latitude-ridges':'bee-ridges', 'season-field':'season-field',
  'threat-spikes':'threatened-grid', 'state-circles':'states',
  'seasonal-signatures':'species-month', 'threatened-swarm':'threatened-records',
  'shared-responsibility':'upset', 'coverage-calendar':'coverage', 'recent-shares':'recent',
};
