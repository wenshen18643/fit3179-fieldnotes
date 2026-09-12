import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chartBuilders } from '../src/chart-specs.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tables={australia:'australia',states:'states',grid:'grid',flows:'flows',families:'families',
  monthly:'monthly',stateMonth:'state-month',speciesMonth:'species-month',rankings:'rankings',
  beeMap:'bee-map',beeRidges:'bee-ridges',beeMonth:'bee-month',threatenedRecords:'threatened-records',
  threatenedListings:'threatened-listings',upset:'upset',coverage:'coverage',recent:'recent',insights:'insights'};
const entries=await Promise.all(Object.entries(tables).map(async([key,file])=>[key,JSON.parse(await fs.readFile(path.join(root,'data/processed',file+'.json'),'utf8'))]));
const data=Object.fromEntries(entries);
await fs.writeFile(path.join(root,'data/story.json'),JSON.stringify(data));
await fs.mkdir(path.join(root,'specs'),{recursive:true});
for(const [id,build] of Object.entries(chartBuilders)){
  const spec=build(data,920);
  await fs.writeFile(path.join(root,'specs',id+'.json'),JSON.stringify(spec,null,2)+'\n');
}
await fs.mkdir(path.join(root,'vendor'),{recursive:true});
for(const [pkg,file,out] of [['vega','build/vega.min.js','vega.min.js'],['vega-lite','build/vega-lite.min.js','vega-lite.min.js'],['vega-embed','build/vega-embed.min.js','vega-embed.min.js']]){
  await fs.copyFile(path.join(root,'node_modules',pkg,file),path.join(root,'vendor',out));
  await fs.copyFile(path.join(root,'node_modules',pkg,'LICENSE'),path.join(root,'vendor',pkg+'-LICENSE.txt'));
}
console.log(`Built ${Object.keys(chartBuilders).length} readable specifications. Chart data: ${(JSON.stringify(data).length/1024).toFixed(0)} KB.`);
