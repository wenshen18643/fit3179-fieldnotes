// npm run build: makes data/story.json (the one data file the page loads), writes every
// chart's spec to specs/ as readable JSON, and copies the chart libraries into vendor/.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// The chart builders live inside index.html. Cut out the part of its script that
// runs from the top down to the end of the chartBuilders list, and load it as code.
const chartCode=page=>{
  const js=page.split('<script type="module">')[1];
  const end=js.indexOf('\n};',js.indexOf('export const chartBuilders'))+3;
  return js.slice(0,end);
};
const page=await fs.readFile(path.join(root,'index.html'),'utf8');
const {chartBuilders}=await import('data:text/javascript,'+encodeURIComponent(chartCode(page)));
// Combine the tables the charts use into data/story.json.
const tables={australia:'australia',states:'states',grid:'grid',gridShapes:'grid-shapes',stateMonth:'state-month',speciesMonth:'species-month',rankings:'rankings',
  beeMap:'bee-map',beeRidges:'bee-ridges',beeMonth:'bee-month',threatenedRecords:'threatened-records',
  threatenedListings:'threatened-listings',upset:'upset',seasonField:'season-field',insights:'insights'};
const entries=await Promise.all(Object.entries(tables).map(async([key,file])=>[key,JSON.parse(await fs.readFile(path.join(root,'data/processed',file+'.json'),'utf8'))]));
const data=Object.fromEntries(entries);
await fs.writeFile(path.join(root,'data/story.json'),JSON.stringify(data));
// Name each spec file after its chart's heading on the page, e.g.
// "Every state keeps its own busy season" -> every-state-keeps-its-own-busy-season.json.
// Old files are deleted first, so a changed heading leaves no stale copy.
const headings=Object.fromEntries([...page.matchAll(/<figure[^>]*data-chart="([^"]+)"[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/g)]
  .map(([,id,h])=>[id,h.replace(/<[^>]+>/g,'').replace(/&[a-z]+;|['’]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')]));
await fs.mkdir(path.join(root,'specs'),{recursive:true});
for(const file of await fs.readdir(path.join(root,'specs')))if(file.endsWith('.json'))await fs.rm(path.join(root,'specs',file));
for(const [id,build] of Object.entries(chartBuilders)){
  if(!headings[id])throw new Error('No heading on the page for '+id);
  const spec=build(data,920);
  await fs.writeFile(path.join(root,'specs',headings[id]+'.json'),JSON.stringify(spec,null,2)+'\n');
}
// Copy Vega, Vega-Lite and Vega-Embed (and their licences) from node_modules into vendor/.
await fs.mkdir(path.join(root,'vendor'),{recursive:true});
for(const [pkg,file,out] of [['vega','build/vega.min.js','vega.min.js'],['vega-lite','build/vega-lite.min.js','vega-lite.min.js'],['vega-embed','build/vega-embed.min.js','vega-embed.min.js']]){
  await fs.copyFile(path.join(root,'node_modules',pkg,file),path.join(root,'vendor',out));
  await fs.copyFile(path.join(root,'node_modules',pkg,'LICENSE'),path.join(root,'vendor',pkg+'-LICENSE.txt'));
}
console.log(`Built ${Object.keys(chartBuilders).length} readable specifications. Chart data: ${(JSON.stringify(data).length/1024).toFixed(0)} KB.`);
