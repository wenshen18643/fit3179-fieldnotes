import {chartBuilders,chartFiles,applyTheme} from './chart-specs.js';

// Design pages set window.fieldTheme to restyle chart type and paper.
const theme=window.fieldTheme||{};
applyTheme(theme);

if(document.readyState==='loading') await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));

const format=new Intl.NumberFormat('en-AU');
const views=new Map();
const widths=new Map();
const errors=[];
// Current value of every control, per chart, so a redraw (resize, lazy load) keeps
// what the reader chose.
const settings={};
let D;
// Charts are drawn one at a time. A chart's width is measured when it is drawn,
// not when it is queued, so a resize arriving mid-queue cannot strand a figure
// at a stale width. A request made while a chart is drawing re-queues it.
const queue=[];
const forced=new Set();
const waiting=new Map();
let draining=false;

// vega-tooltip tries the four corners around the pointer and, if none fits, uses the
// top-left one, which on a phone can push a wide tooltip off screen. Keep it inside.
function keepTooltipOnScreen(tip){
  const clamp=()=>{
    const r=tip.getBoundingClientRect();
    const x=Math.max(8,Math.min(r.left,innerWidth-r.width-8)),y=Math.max(8,Math.min(r.top,innerHeight-r.height-8));
    if(Math.abs(x-r.left)>.5)tip.style.left=x+'px';
    if(Math.abs(y-r.top)>.5)tip.style.top=y+'px';
  };
  // The first position is set in the same task that creates the element, before this runs.
  clamp();
  new MutationObserver(clamp).observe(tip,{attributes:true,attributeFilter:['style']});
}
new MutationObserver((_,observer)=>{
  const tip=document.getElementById('vg-tooltip-element');
  if(tip){observer.disconnect();keepTooltipOnScreen(tip);}
}).observe(document.body,{childList:true});

function fillStats(){
  const i=D.insights;
  const percent=n=>(100*n).toFixed(1)+'%';
  const values={...Object.fromEntries(Object.entries(i).filter(([,v])=>typeof v==='number').map(([k,v])=>[k,format.format(Math.round(v))])),
    eastShare:percent(i.eastShare),ebirdShare:percent(i.ebirdShare),beeSummerSouth:percent(i.beeSummerSouth),beeWinterSouth:percent(i.beeWinterSouth),
    actDensity:format.format(Math.round(D.states.find(s=>s.code==='ACT').density)),
    topGridShare:percent(i.topGridShare),
    allSummerSouth:Math.round(100*i.allSummerSouth)+'%',allWinterSouth:Math.round(100*i.allWinterSouth)+'%',
    // Same precision as the all-birds row it sits beside.
    beeSummerSouthRound:Math.round(100*i.beeSummerSouth)+'%',beeWinterSouthRound:Math.round(100*i.beeWinterSouth)+'%',
    saListed:String(D.states.find(s=>s.code==='SA').listed),
    sharedTaxa:String(D.threatenedListings.filter(r=>r.states.length>1).length),
    ntMultiple:(D.states.find(s=>s.code==='NT').perResident/(i.total/D.states.reduce((n,s)=>n+s.population,0)*1000)).toFixed(1)};
  for(const el of document.querySelectorAll('[data-stat]')) if(values[el.dataset.stat]!==undefined)el.textContent=values[el.dataset.stat];
  const select=document.getElementById('bird-highlight');
  for(const name of new Set(D.rankings.map(r=>r.name))){const option=document.createElement('option');option.textContent=name;select.append(option);}
  // The bump chart's headline promises a bird changing places, so the page must
  // land on that bird rather than on an unhighlighted default the reader has to
  // discover. 'All birds' remains in the list as the reset.
  if([...select.options].some(o=>o.value==='Welcome Swallow')) select.value='Welcome Swallow';
  for(const el of document.querySelectorAll('select[data-signal]'))setting(el.dataset.chart,el.dataset.signal,el.value);
  for(const b of document.querySelectorAll('.segmented [aria-pressed="true"]')){const g=b.closest('.segmented');setting(g.dataset.chart,g.dataset.signal,value(b));}
}

const tableKeys={
  'observation-atlas':['latitude','longitude','count'],
  'record-density':['state','count','area','density','species'],
  'seasonal-clock':['state','label','count','dailyIndex'],
  'monthly-ranks':['name','label','rank','count'],
  'seasonal-footprint':['season','latitude','longitude','count'],
  'season-field':null,
  'state-circles':['state','count','listed','population','perResident'],
  'latitude-ridges':['label','latitude','count','share'],
  'seasonal-signatures':['name','label','count','per10k','relative'],
  'threatened-swarm':['name','scientific','status','count'],
  'shared-responsibility':['combination','count'],
};
const names={latitude:'Latitude',longitude:'Longitude',count:'Records',state:'State',area:'Land area (km²)',density:'Records / 1,000 km²',species:'Named species',
  source:'Source',family:'Family',share:'Share',label:'Month',dailyIndex:'Daily pace / yearly average',name:'Bird',rank:'Rank',season:'Season',
  per10k:'Per 10,000 records',relative:'Relative share',scientific:'Scientific name',status:'National status (2026)',combination:'Exact state combination',
  year:'Year',availability:'Coverage',group:'Kind of bird',threatened:'Threatened-bird records',records:'All bird records',per1000:'Threatened per 1,000 records',
  top:'Most recorded threatened bird',listed:'Listed threatened taxa',population:'Residents (June 2024)',perResident:'Records per 1,000 residents',pct:'Change in share (%)',count2024:'2024 records',count2025:'2025 records',rate2024:'2024 per 10,000',rate2025:'2025 per 10,000',difference:'Share change per 10,000'};

async function showTable(id,button,figure){
  let wrap=figure.querySelector('.data-table-wrap');
  if(wrap){const open=wrap.hidden;wrap.hidden=!open;button.setAttribute('aria-expanded',String(open));button.textContent=open?'Hide data table':'View data table';return;}
  const response=await fetch(`data/processed/${chartFiles[id]}.json`);
  if(!response.ok)throw new Error('Data table could not be loaded');
  const rows=await response.json();
  const keys=tableKeys[id];
  wrap=document.createElement('div');wrap.className='data-table-wrap';wrap.id=`table-${id}`;wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',figure.querySelector('h3').textContent+' data table');
  const table=document.createElement('table');const caption=document.createElement('caption');caption.textContent=figure.querySelector('h3').textContent;table.append(caption);
  const head=document.createElement('thead'),tr=document.createElement('tr');
  for(const key of keys){const th=document.createElement('th');th.scope='col';th.textContent=id==='shared-responsibility'&&key==='count'?'Listed bird taxa':names[key]||key;tr.append(th);}
  head.append(tr);table.append(head);const body=document.createElement('tbody');
  for(const row of rows){const tr=document.createElement('tr');for(const key of keys){const td=document.createElement('td'),val=row[key];
    td.textContent=val===null?'Not included':typeof val==='number'?new Intl.NumberFormat('en-AU',{maximumFractionDigits:4}).format(val):String(val??'');tr.append(td);}body.append(tr);}
  table.append(body);wrap.append(table);figure.append(wrap);button.setAttribute('aria-expanded','true');button.textContent='Hide data table';
}

function addFigureTools(){
  let index=0;
  for(const figure of document.querySelectorAll('figure[data-chart]')){
    const id=figure.dataset.chart;index++;
    const bar=document.createElement('div');bar.className='figure-tools';
    // The figure number leads the metadata line above the title, not the tools row.
    const heading=figure.querySelector('.figure-heading');
    // A page may drop figure numbers (figureLabel returns ''); the period line then shows
    // only when the figure has a date of its own, and disappears when it has none.
    const label=theme.figureLabel||(n=>'Fig. '+String(n).padStart(2,'0'));
    let period=heading.querySelector('.figure-period');
    const text=[label(index),period?.textContent].filter(Boolean).join(' · ');
    if(text){if(!period){period=document.createElement('span');period.className='figure-period';heading.append(period);}period.textContent=text;}
    else period?.remove();
    if(tableKeys[id]){
      const b=document.createElement('button');b.type='button';b.textContent='View data table';b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls',`table-${id}`);
      b.addEventListener('click',()=>showTable(id,b,figure).catch(error=>{b.textContent='Could not load table — retry';errors.push(error.message);}));bar.append(b);
    }
    const ext=tableKeys[id]?'csv':'json';
    const data=document.createElement('a');data.href=`data/processed/${chartFiles[id]}.${ext}`;data.download='';data.textContent=ext.toUpperCase()+' ↓';data.setAttribute('aria-label','Download data for '+figure.querySelector('h3').textContent);bar.append(data);
    const spec=document.createElement('a');spec.href=`specs/${id}.json`;spec.target='_blank';spec.rel='noopener';spec.textContent='Chart specification ↗';bar.append(spec);
    // Tools row removed from the page; data and specs stay in the repository.
  }
}

async function draw(id,force){
  const el=document.getElementById(id);if(!el)return;
  const width=Math.floor(el.getBoundingClientRect().width);
  if(width<1)return;
  if(!force&&views.has(id)&&Math.abs((widths.get(id)||0)-width)<4)return;
  el.classList.add('is-loading');el.setAttribute('aria-busy','true');widths.set(id,width);
  try{
    if(views.has(id)){views.get(id).finalize();views.delete(id);}
    const spec=chartBuilders[id](D,width);
    const result=await window.vegaEmbed(el,spec,{actions:false,renderer:'svg',tooltip:{theme:'light'},hover:true});
    views.set(id,result.view);
    for(const [name,v] of Object.entries(settings[id]||{}))result.view.signal(name,v);
    await result.view.runAsync();
    // The cartogram and the overlap chart share one selected state, in both directions.
    const partner={'state-circles':'shared-responsibility','shared-responsibility':'state-circles'}[id];
    if(partner)result.view.addSignalListener('picked',(_,code)=>{
      setting(id,'picked',code);
      const readout=document.getElementById('picked-state');
      if(readout)readout.textContent=code?`Showing only the combinations that include ${code}. Select ${code} again to clear.`:'Select a circle or a state code to light up the combinations that include it.';
      if((settings[partner]||{}).picked===code)return;
      setting(partner,'picked',code);const other=views.get(partner);if(other)other.signal('picked',code).runAsync();
    });
    el.dataset.rendered='true';
  }catch(error){
    errors.push(`${id}: ${error.message}`);
    el.replaceChildren();const message=document.createElement('p');message.className='chart-error';message.textContent='This figure could not be drawn. The data table and CSV below are still available.';el.append(message);
    console.error(id,error);
  }finally{el.classList.remove('is-loading');el.removeAttribute('aria-busy');}
}

async function drain(){
  if(draining)return;
  draining=true;
  try{
    while(queue.length){
      const id=queue.shift();
      const force=forced.delete(id);
      try{await draw(id,force);}catch(error){errors.push(`${id}: ${error.message}`);}
      if(!queue.includes(id)){const waiter=waiting.get(id);waiting.delete(id);if(waiter)waiter();}
    }
  }finally{draining=false;}
}

function render(id,force=false){
  if(!document.getElementById(id)||!chartBuilders[id])return Promise.resolve();
  if(force)forced.add(id);
  if(!queue.includes(id))queue.push(id);
  let promise=waiting.get(id)&&waiting.get(id).promise;
  if(!promise){
    let resolve;promise=new Promise(r=>{resolve=r;});
    const waiter=()=>resolve();waiter.promise=promise;waiting.set(id,waiter);
  }
  drain();
  return promise;
}

function setting(chart,name,v){(settings[chart]||(settings[chart]={}))[name]=v;}
function value(b){const v=b.dataset.value;return isNaN(+v)?v:+v;}
async function apply(chart,name,v){
  setting(chart,name,v);
  await render(chart);const view=views.get(chart);if(view)await view.signal(name,v).runAsync();
}

function setupControls(){
  for(const el of document.querySelectorAll('select[data-signal]'))
    el.addEventListener('change',()=>apply(el.dataset.chart,el.dataset.signal,el.value));
  for(const group of document.querySelectorAll('.segmented'))
    group.addEventListener('click',event=>{
      const b=event.target.closest('button');if(!b)return;
      for(const other of group.querySelectorAll('button'))other.setAttribute('aria-pressed',String(other===b));
      apply(group.dataset.chart,group.dataset.signal,value(b));
    });
  // The bee-eater map's 'phase' signal runs 0–4 through the seasons, and the map
  // interpolates every circle between them, so changes are animated rather than cut.
  // Play runs the year once: each season holds, then the circles grow, shrink and change
  // colour into the next, while a playhead crosses the four steps beneath them. Picking a
  // season glides there. With reduced motion every change is an instant cut.
  const play=document.getElementById('season-play'),track=play.nextElementSibling;
  const seasons=[...track.querySelectorAll('button')],head=document.createElement('span');
  head.className='playhead';track.append(head);
  const still=matchMedia('(prefers-reduced-motion: reduce)');
  const SEG=2600,MOVE=1100,ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
  let phase=0,frame=0;
  const set=p=>{
    phase=p;setting('seasonal-footprint','phase',p);
    const view=views.get('seasonal-footprint');if(view)view.signal('phase',p).run();
    const on=seasons[Math.round(p)%4];
    for(const o of seasons)o.setAttribute('aria-pressed',String(o===on));
  };
  const stop=()=>{cancelAnimationFrame(frame);frame=0;track.classList.remove('is-playing');play.setAttribute('aria-pressed','false');play.setAttribute('aria-label','Play the year');};
  const run=(duration,at,done)=>{
    cancelAnimationFrame(frame);const t0=performance.now();
    const tick=now=>{const e=Math.min(1,(now-t0)/duration);at(e);frame=e<1?requestAnimationFrame(tick):0;if(e>=1&&done)done();};
    frame=requestAnimationFrame(tick);
  };
  play.addEventListener('click',async()=>{
    if(frame)return stop();
    await render('seasonal-footprint');
    play.setAttribute('aria-pressed','true');play.setAttribute('aria-label','Pause');track.classList.add('is-playing');
    // Four equal segments; each move into the next season is centred on a boundary.
    const total=4*SEG;
    run(total,e=>{
      const ms=e*total;let p=0;
      for(let k=1;k<4;k++)p+=still.matches?+(ms>=k*SEG):ease(Math.min(1,Math.max(0,(ms-k*SEG+MOVE/2)/MOVE)));
      set(p);head.style.width=(e*100)+'%';head.style.background=getComputedStyle(seasons[Math.round(p)%4]).getPropertyValue('--season');
    },stop);
  });
  track.addEventListener('click',async event=>{
    const b=event.target.closest('button');if(!b)return;
    if(frame)stop();
    await render('seasonal-footprint');
    const from=phase,to=seasons.indexOf(b);
    if(still.matches)return set(to);
    run(700,e=>set(from+(to-from)*ease(e)));
  });
  let timer;
  const resize=new ResizeObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{for(const id of widths.keys())render(id);},180);});
  for(const el of document.querySelectorAll('.chart'))resize.observe(el);
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){render(entry.target.id);observer.unobserve(entry.target);}},{rootMargin:'700px 0px'});
  for(const el of document.querySelectorAll('.chart')){el.classList.add('is-loading');observer.observe(el);}
  window.addEventListener('beforeprint',()=>{for(const id of Object.keys(chartBuilders))render(id);});
}

let scrollTick=false;
function updateProgress(){
  scrollTick=false;
  const bar=document.querySelector('.reading-progress span');if(!bar)return;
  const scrollMax=document.documentElement.scrollHeight-window.innerHeight;
  bar.style.transform=`scaleX(${scrollMax>0?window.scrollY/scrollMax:0})`;
}
window.addEventListener('scroll',()=>{if(!scrollTick){scrollTick=true;requestAnimationFrame(updateProgress);}},{passive:true});

try{
  const response=await fetch('data/story.json');if(!response.ok)throw new Error('Chart data unavailable');D=await response.json();
  fillStats();addFigureTools();
  await document.fonts.ready;
  setupControls();
  window.fieldJournal={data:D,views,errors,renderAll:async()=>{for(const id of Object.keys(chartBuilders))await render(id);},render};
  document.documentElement.dataset.ready='true';
}catch(error){
  errors.push(error.message);console.error(error);
  const notice=document.createElement('p');notice.className='chart-error';notice.textContent='The chart data could not be loaded. Open this page through its website address or the included local web server, then reload.';(document.querySelector('main')||document.body).prepend(notice);
}
