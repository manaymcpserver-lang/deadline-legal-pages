import fs from 'node:fs';
import path from 'node:path';
const dir='translations/legal',source=JSON.parse(fs.readFileSync(dir+'/source.json'));
for(const file of fs.readdirSync(dir+'/manual').filter(x=>x.endsWith('.json'))){
 const code=file.slice(0,-5),manual=JSON.parse(fs.readFileSync(path.join(dir,'manual',file)));
 if(manual.sourceHash!==source.sourceHash)throw Error(code+': manual review belongs to another English source');
 const reuse={...JSON.parse(fs.readFileSync(`translations/homepage/${code}.json`)).strings,...JSON.parse(fs.readFileSync(`translations/guides/${code}.json`)).strings};
 const entries=manual.byIndex?Object.fromEntries(Object.entries(manual.byIndex).map(([i,v])=>[source.strings[Number(i)],v])):manual.strings;
 const strings=Object.fromEntries(source.strings.map(k=>[k,entries[k]??reuse[k]]));
 for(const[k,v]of Object.entries(strings))if(typeof v!=='string'||!v.trim())throw Error(code+': missing reviewed translation '+k);
 fs.writeFileSync(`${dir}/${code}.json`,JSON.stringify({locale:code,sourceHash:source.sourceHash,reviewStatus:'in-session-reviewed',method:'Direct AI-assisted translation and in-session review; existing reviewed chrome reused; not professional legal or native-speaker certification',strings},null,2)+'\n');
 console.log(code+': complete reviewed policy dictionary');
}
