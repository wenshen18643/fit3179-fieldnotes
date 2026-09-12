import {chartBuilders,chartFiles} from './chart-specs.js';

if(document.readyState==='loading') await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));

const format=new Intl.NumberFormat('en-AU');
const views=new Map();
const widths=new Map();
const errors=[];
let D;
// Charts are drawn one at a time. A chart's width is measured when it is drawn,
// not when it is queued, so a resize arriving mid-queue cannot strand a figure
// at a stale width. A request made while a chart is drawing re-queues it.
const queue=[];
const forced=new Set();
const waiting=new Map();
let draining=false;

function fillStats(){
  const i=D.insights;
  const percent=n=>(100*n).toFixed(1)+'%';
  const values={...Object.fromEntries(Object.entries(i).filter(([,v])=>typeof v==='number').map(([k,v])=>[k,format.format(Math.round(v))])),
    eastShare:percent(i.eastShare),ebirdShare:percent(i.ebirdShare),beeSummerSouth:percent(i.beeSummerSouth),beeWinterSouth:percent(i.beeWinterSouth),
    actDensity:format.format(Math.round(D.states.find(s=>s.code==='ACT').density))};
  for(const el of document.querySelectorAll('[data-stat]')) if(values[el.dataset.stat]!==undefined)el.textContent=values[el.dataset.stat];
  const select=document.getElementById('bird-highlight');
  for(const name of new Set(D.rankings.map(r=>r.name))){const option=document.createElement('option');option.textContent=name;select.append(option);}
  // The bump chart's headline promises a bird changing places, so the page must
  // land on that bird rather than on an unhighlighted default the reader has to
  // discover. 'All birds' remains in the list as the reset.
  if([...select.options].some(o=>o.value==='Welcome Swallow')) select.value='Welcome Swallow';
}

const tableKeys={
  'observation-atlas':['latitude','longitude','count'],
  'record-density':['state','count','area','density','species'],
  'record-rivers':['source','state','count'],
  'family-canopy':['family','count','share'],
  'seasonal-clock':['state','label','count','dailyIndex'],
  'monthly-ranks':['name','label','rank','count'],
  'seasonal-footprint':['season','latitude','longitude','count'],
  'latitude-ridges':['label','latitude','count','share'],
  'seasonal-signatures':['name','label','count','per10k','relative'],
  'threatened-swarm':['name','scientific','status','count'],
  'shared-responsibility':['combination','count'],
  'coverage-calendar':['source','year','label','count','availability'],
  'recent-shares':['name','count2024','count2025','rate2024','rate2025','difference'],
};
const names={latitude:'Latitude',longitude:'Longitude',count:'Records',state:'State',area:'Land area (km²)',density:'Records / 1,000 km²',species:'Named species',
  source:'Source',family:'Family',share:'Share',label:'Month',dailyIndex:'Daily pace / yearly average',name:'Bird',rank:'Rank',season:'Season',
  per10k:'Per 10,000 records',relative:'Relative share',scientific:'Scientific name',status:'National status (2026)',combination:'Exact state combination',
  year:'Year',availability:'Coverage',count2024:'2024 records',count2025:'2025 records',rate2024:'2024 per 10,000',rate2025:'2025 per 10,000',difference:'Share change per 10,000'};

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
  for(const figure of document.querySelectorAll('[data-chart]')){
    const id=figure.dataset.chart;index++;
    const bar=document.createElement('div');bar.className='figure-tools';
    const n=document.createElement('span');n.className='figure-number';n.textContent='Fig. '+String(index).padStart(2,'0');bar.append(n);
    const b=document.createElement('button');b.type='button';b.textContent='View data table';b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls',`table-${id}`);
    b.addEventListener('click',()=>showTable(id,b,figure).catch(error=>{b.textContent='Could not load table — retry';errors.push(error.message);}));bar.append(b);
    const data=document.createElement('a');data.href=`data/processed/${chartFiles[id]}.csv`;data.download='';data.textContent='CSV ↓';data.setAttribute('aria-label','Download data for '+figure.querySelector('h3').textContent);bar.append(data);
    const spec=document.createElement('a');spec.href=`specs/${id}.json`;spec.target='_blank';spec.rel='noopener';spec.textContent='Chart specification ↗';bar.append(spec);
    figure.append(bar);
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
    if(id==='seasonal-footprint')await result.view.signal('season',document.getElementById('season-select').value).runAsync();
    if(id==='monthly-ranks')await result.view.signal('highlight',document.getElementById('bird-highlight').value).runAsync();
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

function setupControls(){
  document.getElementById('season-select').addEventListener('change',async event=>{
    await render('seasonal-footprint');const view=views.get('seasonal-footprint');if(view)await view.signal('season',event.target.value).runAsync();
  });
  document.getElementById('bird-highlight').addEventListener('change',async event=>{
    await render('monthly-ranks');const view=views.get('monthly-ranks');if(view)await view.signal('highlight',event.target.value).runAsync();
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
  const scrollMax=document.documentElement.scrollHeight-window.innerHeight;
  document.querySelector('.reading-progress span').style.transform=`scaleX(${scrollMax>0?window.scrollY/scrollMax:0})`;
  scrollTick=false;
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
  const notice=document.createElement('p');notice.className='chart-error';notice.textContent='The chart data could not be loaded. Open this page through its website address or the included local web server, then reload.';document.querySelector('.orientation').after(notice);
}
