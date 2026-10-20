/* Offline rendering of editable marketing HTML, not a live-device capture. */
/* eslint-disable @typescript-eslint/no-require-imports -- standalone offline CommonJS renderer */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('/Users/manay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('/Users/manay/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),data=path.join(root,'translations/website-artwork');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'app/homepage-artwork.json')));
const guide=JSON.parse(fs.readFileSync(path.join(root,'app/guides/artwork.json')));
const items=JSON.parse(fs.readFileSync(path.join(data,'preparation.json')));
if(items.some(i=>i.missing.length))throw Error('Untranslated artwork text remains');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const audit=[];
 try{
 for(const item of items.filter(i=>!process.argv[2]||i.slot===process.argv[2])){
  const page=await browser.newPage({viewport:{width:item.width,height:item.height},deviceScaleFactor:1});
  await page.goto(pathToFileURL(item.file).href);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{
   const finalTask=[...document.querySelectorAll('[data-task-title]')].at(-1);
   if(finalTask)finalTask.parentElement.style.paddingRight='40px';
   // Fit copy inside existing mockup geometry rather than clipping long scripts.
   for(const el of document.querySelectorAll('div,span')){
    if(el.children.length||!el.textContent.trim())continue;
    const style=getComputedStyle(el);let size=parseFloat(style.fontSize);
    if(size>=80)el.style.textWrap='balance';
    if(size<80){
     el.style.overflowWrap='anywhere';
     while(el.scrollWidth>el.clientWidth+1&&size>10){size-=.5;el.style.fontSize=size+'px';}
    }
   }
   for(const el of document.querySelectorAll('[data-task-title]')){
    el.style.lineHeight='1.15';let size=parseFloat(getComputedStyle(el).fontSize);
    while(el.offsetHeight>49&&size>12){size-=.5;el.style.fontSize=size+'px';}
   }
   for(const el of document.querySelectorAll('[data-task-date]')){
    el.style.whiteSpace='nowrap';let size=parseFloat(getComputedStyle(el).fontSize);
    while(el.scrollWidth>el.clientWidth+1&&size>10){size-=.5;el.style.fontSize=size+'px';}
   }
   const header=[...document.querySelectorAll('div')].find(el=>el.style.position==='absolute'&&el.style.textAlign==='center'&&el.children.length===2&&parseFloat(getComputedStyle(el.children[0]).fontSize)>=80);
   if(header){
    const phone=[...document.querySelectorAll('body>div>div')].find(el=>el.style.transform.includes('translateX')&&parseFloat(el.style.top)>400);
    const bottom=phone?parseFloat(phone.style.top)-40:600;
    for(let n=0;n<100&&header.getBoundingClientRect().bottom>bottom;n++){
     for(const child of header.children){const size=parseFloat(getComputedStyle(child).fontSize);child.style.fontSize=(size*.98)+'px';}
    }
   }
  });
  const check=await page.evaluate(()=>({brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src.slice(0,80)),externalBackgrounds:[...document.querySelectorAll('[style]')].filter(e=>/url\(/.test(e.style.backgroundImage)&&!e.style.backgroundImage.includes('data:')).map(e=>e.style.backgroundImage),text:document.body.innerText,icons:[...document.images].map(i=>({src:i.src,width:i.naturalWidth,height:i.naturalHeight})),heading:[...document.querySelectorAll('div')].filter(e=>!e.children.length&&parseFloat(getComputedStyle(e).fontSize)>70).map(e=>e.textContent)}));
  if(check.brokenImages.length)throw Error(`${item.locale}/${item.slot}: broken icon`);
  if(check.externalBackgrounds.length)throw Error(`${item.locale}/${item.slot}: unresolved background icon`);
  if(item.slot==='ios-tasks')for(const brand of ['Canvas','Notion','Slack','Google Tasks'])if(!check.text.includes(brand))throw Error('Changed brand '+brand);
  const width=item.slot.startsWith('ios')?660:1080,height=Math.round(item.height*width/item.width);
  const file=`${item.locale}-${item.slot}-website.jpg`,src='/assets/homepage-artwork/'+file;
  const bytes=await sharp(await page.screenshot({animations:'disabled'})).resize(width,height).jpeg({quality:90}).toBuffer();
  fs.writeFileSync(path.join(root,'public',src),bytes);
  const asset={src,language:item.locale,locale:item.locale,platform:item.slot.startsWith('ios')?'iOS':'Android',kind:'website-illustration',width,height,source:{type:'localized-editable-website-artwork',localFile:path.relative(root,item.file),notUploadedToStores:true},sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  (manifest.assets[item.locale]??={})[`/assets/screens/${item.slot}.png`]=asset;
  if(item.slot==='ios-blocker')guide.assets[item.locale]=asset;
  audit.push({...item,brokenImages:check.brokenImages,visibleText:check.text,iconCount:check.icons.length,output:src,sha256:asset.sha256});
  await page.close();console.log(`${item.locale}/${item.slot}`);
 }
 fs.writeFileSync(path.join(root,'app/homepage-artwork.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(root,'app/guides/artwork.json'),JSON.stringify(guide,null,2)+'\n');
 const prior=process.argv[2]?JSON.parse(fs.readFileSync(path.join(data,'render-audit.json'))).filter(i=>i.slot!==process.argv[2]):[];
 fs.writeFileSync(path.join(data,'render-audit.json'),JSON.stringify([...prior,...audit],null,2)+'\n');
 console.log(`Rendered ${audit.length} website illustrations; all icons loaded and service names preserved. No uploads.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
