// Reuse existing store illustrations only. No store writes or new translations.
/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS asset preparation */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const appRoot = '/Users/manay/Desktop/DeadLine';
const request = require(path.join(appRoot, 'release/final-submission-2026-10-18/apple-api.cjs'));
const locales = require('../app/guides/locales.json');
const guide = require('../app/guides/artwork.json');
const normalize = code => ({'en-US':'en','es-ES':'es','fr-FR':'fr','de-DE':'de','ar-SA':'ar','nl-NL':'nl','bn-BD':'bn','ta-IN':'ta','te-IN':'te','ur-PK':'ur','no':'nb'}[code] || code);
const report = { kind: 'Existing localized App Store and Google Play illustrations, not raw device captures', policy: 'Use matching language, platform and screen; otherwise label the original English screenshot.', assets: {} };
const existingFile = path.join(__dirname,'../app/homepage-artwork.json');
if (fs.existsSync(existingFile)) {
  for (const [locale, assets] of Object.entries(JSON.parse(fs.readFileSync(existingFile)).assets)) {
    for (const [slot, asset] of Object.entries(assets)) {
      if (slot.startsWith('/assets/screens/android-') && asset.source?.store === 'Google Play') (report.assets[locale] ??= {})[slot] = asset;
    }
  }
}
const directory = path.join(__dirname, '../public/assets/homepage-artwork');
function add(locale, slot, bytes, source) {
  const filename = `${locale}-${slot}.jpg`;
  fs.writeFileSync(path.join(directory, filename), bytes);
  (report.assets[locale] ??= {})[`/assets/screens/${slot}.png`] = {src:`/assets/homepage-artwork/${filename}`,language:locale,kind:'store-illustration',width:660,height:1434,source,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
}
(async () => {
  fs.mkdirSync(directory, {recursive:true});
  for (const [locale, asset] of Object.entries(guide.assets)) {
    (report.assets[locale] ??= {})['/assets/screens/ios-blocker.png'] = {...asset,language:locale,width:660,height:1434};
  }
  const sets = require(path.join(appRoot, 'release/final-submission-2026-10-18/ios-screenshot-order-applied.json')).sets;
  for (const set of sets.filter(x => x.display === 'APP_IPHONE_67')) {
    const locale = normalize(set.locale);
    if (locale === 'en' || !locales.includes(locale)) continue;
    const items = (await request('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots?limit=50`)).data;
    for (const [slot, match] of [['ios-home',/home|know-whats-due-before-you-scroll/],['ios-tasks',/one-list-for-every-source/],['ios-planner',/planner|turn-deadlines-into-a-day-plan/],['ios-blocker',/deadline-blocking|a-deadline-is-waiting/]]) {
      if (report.assets[locale]?.[`/assets/screens/${slot}.png`]) continue;
      const item = items.find(x => match.test(x.attributes.fileName));
      if (!item?.attributes.imageAsset) continue;
      const url = item.attributes.imageAsset.templateUrl.replace('{w}','660').replace('{h}','1434').replace('{f}','jpg');
      const response = await fetch(url);
      if (!response.ok) throw Error(`${locale}/${slot}: ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes[0] !== 255 || bytes[1] !== 216) throw Error('Expected JPEG');
      add(locale, slot, bytes, {store:'App Store',id:item.id,fileName:item.attributes.fileName});
    }
    console.log(`${locale}: matched existing store artwork`);
  }
  for (const locale of locales.filter(x => x !== 'en')) {
    const local = path.join(appRoot,'release/ios-localization-expansion',locale === 'nb' ? 'no' : locale,'iphone');
    for (const [slot, file] of [['ios-home','03-know-whats-due-before-you-scroll.jpg'],['ios-tasks','02-one-list-for-every-source.jpg'],['ios-planner','04-turn-deadlines-into-a-day-plan.jpg']]) {
      if (report.assets[locale]?.[`/assets/screens/${slot}.png`]) continue;
      const source = path.join(local,file);
      if (!fs.existsSync(source)) continue;
      add(locale,slot,fs.readFileSync(source),{localFile:path.relative(appRoot,source)});
      report.assets[locale][`/assets/screens/${slot}.png`].width = 1320;
      report.assets[locale][`/assets/screens/${slot}.png`].height = 2868;
    }
  }
  fs.writeFileSync(path.join(__dirname,'../app/homepage-artwork.json'), JSON.stringify(report,null,2)+'\n');
  console.log(`Prepared artwork for ${Object.keys(report.assets).length} languages. No store changes.`);
})().catch(error=>{console.error(error.message);process.exitCode=1});
