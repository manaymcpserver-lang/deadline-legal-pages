// Reuse the exact prepared store artwork, with provenance. No store calls.
/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS asset tool */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const release='/Users/manay/Desktop/DeadLine/release/localization-expansion-2026-10-19';
const manifest=JSON.parse(fs.readFileSync(path.join(root,'app/homepage-artwork.json')));
const labels=JSON.parse(fs.readFileSync(path.join(root,'translations/play-media-labels.json')));
const native={ca:'Il·lustració de Google Play',da:'Google Play-illustration',fi:'Google Play -kuvitus',el:'Εικόνα προώθησης Google Play',hu:'Google Play-illusztráció',ms:'Ilustrasi Google Play',nb:'Google Play-illustrasjon',ro:'Ilustrație Google Play',hr:'Ilustracija za Google Play',sk:'Ilustrácia Google Play',sl:'Ilustracija za Google Play',gu:'Google Playનું પ્રચાર ચિત્ર',kn:'Google Play ಪ್ರಚಾರ ಚಿತ್ರ',ml:'Google Play പ്രചാരണ ചിത്രം',mr:'Google Play प्रचार चित्र',pa:'Google Play ਪ੍ਰਚਾਰ ਚਿੱਤਰ'};
function copyAsset(locale,slot,source,platform,width,height,provenance){
 const bytes=fs.readFileSync(source);const extension=bytes[0]===255&&bytes[1]===216?'.jpg':path.extname(source),src=`/assets/homepage-artwork/${locale}-${slot}${extension}`;
 fs.copyFileSync(source,path.join(root,'public',src));
 (manifest.assets[locale]??={})[`/assets/screens/${slot}.png`]={src,language:locale,platform,kind:'store-illustration',width,height,source:provenance,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
}
for(const item of JSON.parse(fs.readFileSync(release+'/android-listings.json'))){
 for(const [slot,name,number]of[['android-blocker','02-deadline-blocking',2],['android-schedule','06-schedule',6],['android-insights','08-insights',8]]){
  const source=path.join(release,'android',item.appLanguage,name+'.png');
  copyAsset(item.appLanguage,slot,source,'Android',1080,1920,{store:'Google Play',listingLocale:item.locale,screenNumber:number,localFile:source,status:'prepared-store-submission'});
 }
 labels[item.appLanguage]=native[item.appLanguage];
}
for(const item of JSON.parse(fs.readFileSync(release+'/ios-listings.json'))){
 const source=path.join(release,'ios-planner',item.assetLocale,'iphone.png');
 copyAsset(item.appLanguage,'ios-planner',source,'iOS',1320,2868,{store:'App Store',listingLocale:item.locale,screenNumber:4,localFile:source,status:'prepared-store-submission'});
}
fs.writeFileSync(path.join(root,'app/homepage-artwork.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(root,'translations/play-media-labels.json'),JSON.stringify(labels,null,2)+'\n');
console.log('Reused 48 Android and 17 corrected iOS Planner images; videos unchanged.');
