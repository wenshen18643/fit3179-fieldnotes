import fs from 'node:fs/promises';
import path from 'node:path';
import * as vega from 'vega';
import {compile} from 'vega-lite';
import {chartBuilders} from '../src/chart-specs.js';

const D=JSON.parse(await fs.readFile('data/story.json','utf8'));
const table=async name=>JSON.parse(await fs.readFile(`data/processed/${name}.json`,'utf8'));
const [flows,monthly,families,coverage]=await Promise.all(['flows','monthly','families','coverage'].map(table));
const assert=(ok,message)=>{if(!ok)throw new Error(message);};
assert(D.states.reduce((n,r)=>n+r.count,0)===D.insights.total,'State totals do not reconcile');
assert(flows.reduce((n,r)=>n+r.count,0)===D.insights.total,'Source totals do not reconcile');
assert(D.grid.reduce((n,r)=>n+r.count,0)===D.insights.total,'Map totals do not reconcile');
assert(monthly.reduce((n,r)=>n+r.count,0)===D.insights.total,'Monthly totals do not reconcile');
assert(families.reduce((n,r)=>n+r.count,0)===D.insights.total,'Family totals do not reconcile');
assert(coverage.filter(r=>r.year===2025&&r.source==='eBird Australia'&&r.month>=9).every(r=>r.count===0),'Unexpected source coverage; reconsider 2024 baseline');
assert(D.threatenedRecords.every(r=>r.count>0&&r.scientific.split(' ').length===2),'Conservation join contains unmatched or infraspecific taxa');
await fs.mkdir('artifacts/qa',{recursive:true});
let n=0;
for(const width of [920,360])for(const [id,builder] of Object.entries(chartBuilders)){
  const spec=builder(D,width);
  const runtime=spec.$schema.includes('vega-lite')?compile(spec).spec:spec;
  const view=new vega.View(vega.parse(runtime),{renderer:'none'});
  try{
    await view.runAsync();
    const svg=await view.toSVG();
    assert(svg.includes('<svg'),'No SVG output: '+id);
    assert(!/\b(?:NaN|Infinity)\b/.test(svg),'Invalid plotted coordinate: '+id);
    await fs.writeFile(path.join('artifacts/qa',`${id}-${width}.svg`),svg);
    // Every control must visibly change its chart.
    const controls={'seasonal-footprint':['season','Winter'],'monthly-ranks':['highlight','Australian Magpie'],
      'observation-atlas':['cover',.9],'record-density':['measure','people'],'season-field':['who','Bee-eater'],
      'state-circles':['picked','SA'],'shared-responsibility':['picked','SA']};
    if(controls[id]){
      view.signal(...controls[id]);await view.runAsync();
      assert(await view.toSVG()!==svg,'Control did not change output: '+id);
    }
    console.log('PASS',id,width);n++;
  }finally{view.finalize();}
}
console.log(`Passed aggregation, source-coverage and interaction checks; rendered ${n} desktop/mobile SVG charts.`);
