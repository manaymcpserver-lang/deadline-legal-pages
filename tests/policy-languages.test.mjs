import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const root=new URL('../',import.meta.url);
const read=p=>readFile(new URL(p,root),'utf8');
const locales=JSON.parse(await read('app/guides/locales.json'));
const pages=['privacy','terms','support','data-deletion'];
const path=(code,page)=>`/${code==='en'?'':code+'/'}${page}/`;
const visible=s=>s.replace(/<script\b[\s\S]*?<\/script>/gi,'');
test('all policy/help dictionaries cover the complete current English source',async()=>{
 const source=JSON.parse(await read('translations/legal/source.json'));
 for(const code of locales.filter(c=>c!=='en')){
  const d=JSON.parse(await read(`translations/legal/${code}.json`));
  assert.equal(d.sourceHash,source.sourceHash,code);
  assert.deepEqual(Object.keys(d.strings).sort(),[...source.strings].sort(),code);
  for(const [k,v]of Object.entries(d.strings)){
   assert.ok(typeof v==='string'&&v.trim(),`${code}: ${k}`);
   assert.doesNotMatch(v,/NONLATEX\d+TOKEN|⟦NL|<script\b|\{\{/);
   for(const token of ['support@nonlate.app','Nonlate Data Deletion Request','AES-256-GCM','AES-256','HTTPS/TLS','EncryptedSharedPreferences','RevenueCat'])if(k.includes(token))assert.ok(v.includes(token),`${code}: ${token}`);
  }
 }
});
test('all 188 privacy, terms, support and deletion pages keep localized routes and canonical alternates',async()=>{
 const sitemap=await read('out/sitemap.xml');
 for(const code of locales)for(const page of pages){
  const route=path(code,page),html=await read('out'+route+'index.html'),body=visible(html);
  assert.match(html,new RegExp(`<html[^>]*lang="${code}"`));
  assert.ok(html.includes(`rel="canonical" href="https://nonlate.app${route}"`),route);
  assert.equal((body.match(/<h1\b/g)||[]).length,1,route);
  assert.ok(sitemap.includes(`<loc>https://nonlate.app${route}</loc>`));
  assert.ok(body.includes('mailto:support@nonlate.app'),route);
  for(const target of locales){
   const href=path(target,page);
   assert.ok(body.includes(`href="${href}"`),`${route}: selector ${target}`);
   assert.ok(html.includes(`href="https://nonlate.app${href}"`),`${route}: alternate ${target}`);
  }
  if(code!=='en'){
   assert.doesNotMatch(html.replace(/<script type="module" src="\/language-suggestion\.js"[^>]*><\/script>/g,''),/<script\b/,'static policy pages must not hydrate back to English');
   for(const target of pages)assert.ok(body.includes(`href="${path(code,target)}"`),`${route}: legal navigation ${target}`);
   assert.ok(body.includes(`href="/${code}/"`),`${route}: localized homepage`);
   assert.ok(body.includes(`href="/${page}/" hreflang="en"`),`${route}: English original`);
   if(['ar','fa','he','ur'].includes(code))assert.match(html,/<html[^>]*dir="rtl"/);
  }
 }
});
test('translations retain the Google policy link and usable deletion-request subject',async()=>{
 for(const code of locales){
  const privacy=await read('out'+path(code,'privacy')+'index.html');
  assert.ok(privacy.includes('https://developers.google.com/terms/api-services-user-data-policy'));
  const deletion=await read('out'+path(code,'data-deletion')+'index.html');
  assert.ok(deletion.includes('Nonlate Data Deletion Request'));
 }
});
