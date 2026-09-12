// Original, data-driven Vega and Vega-Lite specifications for the field journal.
// Also used by the browser: the published JSONs and live figures share one source.
export const C = {
  ink: '#292e27', muted: '#60665c', rule: '#d5d0c1', paper: '#f8f5ec',
  // Green means record volume everywhere in the journal, ochre means below the
  // usual volume, and rust is reserved for conservation. Nothing else encodes a
  // hue, which is why there is no categorical species palette here any more.
  green: '#315e4c', ochre: '#ad7926', rust: '#a74735',
  // The four seasons are the one categorical scale left. No pair is red against
  // green: that is the pairing that collapses for the commonest colour blindness,
  // so autumn is a mauve rather than a rust.
  seasons: ['#b0782c', '#8c5a86', '#557784', '#58723e'],
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
    scales:[{name:'source',type:'ordinal',domain:sourceNames,range:[C.green,C.ochre,'#627c90']}],
    marks:[{type:'path',from:{data:'links'},encode:{enter:{path:{field:'path'},fill:{scale:'source',field:'source'},fillOpacity:{value:.42},
      tooltip:{signal:"{'Dataset':datum.source,'State':datum.state,'Records':format(datum.count,',')}"}},update:{fillOpacity:{value:.42}},hover:{fillOpacity:{value:.85}}}},
      {type:'rect',from:{data:'nodes'},encode:{enter:{x:{signal:`datum.side==='left'?${left-6}:${right}`},width:{value:6},y:{field:'y0'},y2:{field:'y1'},
        fill:{signal:`datum.side==='left'?scale('source',datum.source):'${C.ink}'`},tooltip:{signal:"{'Name':datum.label,'Records':format(datum.count,',')}"}}}},
      {type:'rule',from:{data:'leaders'},encode:{enter:{x:{value:right+6},x2:{value:right+11},y:{field:'y'},y2:{field:'labelY'},
        stroke:{value:C.rule},strokeWidth:{value:1}}}},
      {type:'text',from:{data:'nodes'},encode:{enter:{x:{signal:`datum.side==='left'?${left-14}:${right+13}`},y:{signal:'datum.labelY-6'},
        text:{field:'name'},align:{signal:"datum.side==='left'?'right':'left'"},fontSize:{value:narrow?12:14},fontWeight:{value:500}}}},
      {type:'text',from:{data:'nodes'},encode:{enter:{x:{signal:`datum.side==='left'?${left-14}:${right+13}`},y:{signal:'datum.labelY+11'},
        text:{signal:"format(datum.count/"+total+",'.1%')"},align:{signal:"datum.side==='left'?'right':'left'"},fontSize:{value:11},fill:{value:C.muted}}}},
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
  const counts=D.families.map(r=>r.count), lo=Math.min(...counts), hi=Math.max(...counts);
  const plot=H-44, labelSize=w<500?11:12;
  const vals=[{id:'root',parent:null,count:0},...D.families.map((r,i)=>({...r,id:r.family,parent:'root',rank:i,
    label:(friendly[r.family]||[r.family])[0],longLabel:(friendly[r.family]||[r.family,r.family])[1],
    onDark:Math.log(r.count/lo)/Math.log(hi/lo)>.52}))];
  return V(width,H,{description:'Treemap of the fifteen most-recorded bird families and the remainder. Rectangle area and colour lightness both encode records, not species richness.',
    data:[{name:'tree',values:vals,transform:[{type:'stratify',key:'id',parentKey:'parent'},
      {type:'treemap',field:'count',sort:{field:'value',order:'descending'},method:'squarify',ratio:1.35,size:[width,plot],paddingInner:4}]},
      {name:'leaves',source:'tree',transform:[{type:'filter',expr:'datum.depth===1'}]}],
    scales:[{name:'fill',type:'log',domain:[lo,hi],range:['#e2e7d8',C.green]}],
    marks:[{type:'rect',from:{data:'leaves'},encode:{enter:{x:{field:'x0'},x2:{field:'x1'},y:{field:'y0'},y2:{field:'y1'},
      fill:{scale:'fill',field:'count'},tooltip:{signal:"{'Family':datum.longLabel,'Scientific family':datum.family,'Records':format(datum.count,','),'Share':format(datum.share,'.1%')}"}},
      hover:{stroke:{value:C.ink},strokeWidth:{value:1.5}}}},
      {type:'text',from:{data:'leaves'},encode:{enter:{x:{signal:'datum.x0+12'},y:{signal:'datum.y0+22'},text:{field:'label'},
        fill:{signal:"datum.onDark?'#fffdf5':'#292e27'"},fontSize:{value:labelSize},fontWeight:{value:500},limit:{signal:'datum.x1-datum.x0-20'},
        // A clipped word reads worse than no word, and the tooltip carries the full
        // name either way, so hide the label unless the block is wide enough for it.
        opacity:{signal:`datum.x1-datum.x0 > length(datum.label)*${labelSize*0.58}+22 && datum.y1-datum.y0>42?1:0`}}}},
      {type:'text',from:{data:'leaves'},encode:{enter:{x:{signal:'datum.x0+12'},y:{signal:'datum.y0+42'},text:{signal:"format(datum.share,'.1%')"},
        fill:{signal:"datum.onDark?'#fffdf5':'#292e27'"},fontSize:{value:11},opacity:{signal:'datum.x1-datum.x0>58 && datum.y1-datum.y0>48?1:0'}}}},
    ],
    // Legend values must sit inside the scale domain or Vega drops them, and the
    // smallest family here still holds about 230,000 records.
    legends:[{fill:'fill',type:'gradient',direction:'horizontal',orient:'none',legendX:0,legendY:plot+14,
      title:'Records',titleLimit:width,values:[300000,1000000,3000000],format:'.0s',
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
      {data:{values:end},transform:[{filter:'!('+picked+')'}],
        mark:{type:'text',align:'left',dx:13,fontSize:compact?10:11,color:C.muted},encoding:{...base,text:{field:'name'}}},
      {data:{values:end},transform:[{filter:picked}],
        mark:{type:'text',align:'left',dx:13,fontSize:compact?10:11,fontWeight:700,color:C.ochre},encoding:{...base,text:{field:'name'}}},
    ]});
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
  // The flat rows are the control, not filler: grouping them against the birds
  // that swing makes the contrast the chart's actual claim.
  const groups={
    'Birds that arrive and leave':['White-throated Needletail','Eastern Koel','Red-necked Stint','Rainbow Bee-eater'],
    'Birds recorded every month':['Silvereye','Welcome Swallow','Superb Fairy-wren','Australian Magpie'],
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
    spec:{width:Math.max(180,Math.round(width)),height:4*(compact?26:32),
      mark:{type:'rect',stroke:C.paper,strokeWidth:2,cornerRadius:1},
      encoding:{x:{field:'label',type:'ordinal',sort:MONTHS,axis:{title:null,labelAngle:0}},
        y:{field:'name',type:'ordinal',sort:order.flatMap(g=>groups[g]),axis:{title:null,labelLimit:compact?130:210,labelFontSize:compact?10:12}},
        color:{field:'relative',type:'quantitative',scale:{type:'log',domain:[.25,1,4],range:['#b18a55','#efeadd',C.green],clamp:true},
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
  // Vega stamps every datum it ingests with a tuple id kept on a symbol key, and
  // object spread copies symbol keys. Spreading one combination into eight row
  // objects would therefore hand all eight the same id on any redraw after the
  // first, and Vega would keep only the last, collapsing the matrix onto a single
  // row. Copy the fields explicitly so each row object is genuinely new.
  const combo=c=>({id:c.id,combination:c.combination,count:c.count});
  const bars=D.upset.map(combo);
  const matrix=D.upset.flatMap(c=>codes.map((code,row)=>({...combo(c),code,row,active:c.states.includes(code)})));
  const rules=D.upset.map(c=>({...combo(c),min:Math.min(...c.states.map(s=>codes.indexOf(s))),max:Math.max(...c.states.map(s=>codes.indexOf(s)))}));
  return V(width,H,{description:'An UpSet chart of the twelve most common exact state combinations among 150 extant threatened bird taxa listed by DCCEEW in the eight jurisdictions. A connected column is an exact combination of states, and the bar above counts listed taxa in it.',
    padding:{left:45,right:10,top:20,bottom:18},
    data:[{name:'bars',values:bars},{name:'matrix',values:matrix},{name:'links',values:rules},{name:'codes',values:codes.map((code,row)=>({code,row}))}],
    scales:[{name:'x',type:'band',domain:{data:'bars',field:'id'},range:'width',padding:.28},
      {name:'y',type:'linear',domain:[0,Math.max(...bars.map(r=>r.count))*1.2],range:[140,0],zero:true}],
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
  // The figure's question is whether a month has records at all, so colour encodes
  // exactly that. A ramp normalised per row made 719,000 and 22,400 the same green,
  // which meant colour said something different in every row. The printed counts
  // carry the volume instead.
  const states=['Recorded','No records in snapshot','Outside comparison'];
  const labels={'Recorded':'Records in this snapshot','No records in snapshot':'No records in this snapshot (×)','Outside comparison':'Outside the comparison (—)'};
  const rows=D.coverage.map(r=>({...r,row:short[r.source]+' · '+r.year,coverage:labels[r.availability],
    cellLabel:r.count===null?'—':r.count===0?'×':r.count>=1000?(r.count/1000).toFixed(r.count>=100000?0:1)+'k':String(r.count)}));
  const order=[...new Set(rows.map(r=>r.row))];
  return VL(w-(compact?128:180),360,{description:'Source-by-month coverage for 2024–2026. Colour marks whether a month holds records at all; the printed number gives the count. Crosses mean no records in this archived dataset snapshot, not zero birds. Months after August 2026 are outside the comparison.',
    data:{values:rows},encoding:{x:{field:'label',type:'ordinal',sort:MONTHS,axis:{title:null,labelAngle:0,labelFontSize:compact?10:12}},
      y:{field:'row',type:'ordinal',sort:order,axis:{title:null,labelFontSize:compact?10:12,labelLimit:compact?120:170}},
      tooltip:[tooltip('source','Source'),tooltip('year','Year'),tooltip('label','Month'),tooltip('availability','Coverage'),tooltip('count','Records',',')]},
    layer:[{mark:{type:'rect',stroke:C.paper,strokeWidth:3,cornerRadius:1},
      encoding:{color:{field:'coverage',type:'nominal',sort:states.map(s=>labels[s]),
        scale:{domain:states.map(s=>labels[s]),range:[C.green,'#ddd7c6','#f2eee4']},
        legend:{title:null,orient:'bottom',direction:'horizontal',columns:compact?1:3,symbolType:'square',symbolSize:170,labelLimit:300,offset:14}}}},
      {mark:{type:'text',fontSize:compact?8:10,fontWeight:500},encoding:{text:{field:compact?'availability':'cellLabel'},
        ...(compact?{text:{condition:[{test:"datum.availability==='Outside comparison'",value:'—'},{test:"datum.availability==='No records in snapshot'",value:'×'}],value:''}}:{}),
        color:{condition:{test:"datum.availability==='Recorded'",value:C.paper},value:C.muted}}}],
  });
}

function recent(D,w) {
  const compact=w<680;
  // Relative change, not absolute. On a per-10,000 scale the most-recorded birds
  // win the ranking by base rate alone: the Kookaburra's −5.1 is a 2.6% shift while
  // the Silvereye's −6.2 is 10.7%. Dividing by each bird's own 2024 rate removes
  // that advantage. Green above zero and ochre below match the seasonal clock, so
  // green means more records than usual everywhere in the journal.
  const rows=D.recent.map(r=>({...r,pct:100*(r.rate2025-r.rate2024)/r.rate2024}));
  const y={field:'name',type:'ordinal',sort:{field:'pct',order:'descending'},axis:{title:null,labelLimit:compact?135:190,labelFontSize:compact?10:12}};
  const x={field:'pct',type:'quantitative',scale:{zero:true,nice:true},
    axis:{title:'Change relative to the bird’s own 2024 share',titleLimit:400,tickCount:5,labelExpr:"format(datum.value,'+.0f')+'%'"}};
  const hue={condition:{test:'datum.pct>=0',value:C.green},value:C.ochre};
  const tip=[tooltip('name','Bird'),tooltip('pct','Change in share','+.1f'),tooltip('rate2024','2024 per 10,000','.1f'),
    tooltip('rate2025','2025 per 10,000','.1f'),tooltip('count2024','2024 records',','),tooltip('count2025','2025 records',',')];
  const value=(test,dx,align)=>({transform:[{filter:test}],
    mark:{type:'text',dx,align,fontSize:compact?10:11,fontWeight:500},
    encoding:{y,x,text:{field:'pct',type:'quantitative',format:'+.1f'},color:hue}});
  return VL(w-(compact?157:220),300,{description:'Percentage change in each featured bird’s share of all iNaturalist Australian bird records between 2024 and 2025, around a zero midpoint. Relative change removes the base-rate advantage of the most-recorded birds. Platform-specific record share is not population change.',
    data:{values:rows},
    layer:[{mark:{type:'rule',color:C.rule,strokeWidth:1.2},encoding:{x:{datum:0}}},
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
