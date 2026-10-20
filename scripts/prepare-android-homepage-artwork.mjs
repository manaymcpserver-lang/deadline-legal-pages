// Copy existing, UI-verified Google Play artwork. No store edits or translations.
import fs from 'node:fs';
import crypto from 'node:crypto';
const report = JSON.parse(fs.readFileSync('translations/android-store-inventory.json','utf8'));
const artwork = JSON.parse(fs.readFileSync('app/homepage-artwork.json','utf8'));
const normalize = code => ({'bn-BD':'bn','zh-CN':'zh-Hans','zh-TW':'zh-Hant','cs-CZ':'cs','nl-NL':'nl','fr-FR':'fr','de-DE':'de','iw-IL':'he','hi-IN':'hi','it-IT':'it','ja-JP':'ja','ko-KR':'ko','pl-PL':'pl','ru-RU':'ru','es-ES':'es','sv-SE':'sv','ta-IN':'ta','te-IN':'te','tr-TR':'tr'}[code] || code);
const slots = [['android-blocker',1],['android-schedule',5],['android-insights',7]];
for (const set of report.sets) {
  if (set.images.length !== 8) throw Error(`Incomplete UI inventory: ${set.locale}`);
  const locale = normalize(set.locale);
  for (const [slot,index] of slots) {
    const sourceUrl = set.images[index].src;
    if (new URL(sourceUrl).origin !== 'https://lh3.googleusercontent.com') throw Error('Unexpected artwork host');
    // Google Play's full-size Preview used this exact size suffix in the DOM;
    // bare thumbnail URLs are only 288×512 and must not be upscaled on the site.
    const downloadUrl = `${sourceUrl}=s1920`;
    const response = await fetch(downloadUrl);
    if (!response.ok) throw Error(`${locale}/${slot}: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const extension = bytes[0]===255 && bytes[1]===216 ? 'jpg' : bytes.subarray(1,4).toString()==='PNG' ? 'png' : null;
    if (!extension) throw Error(`Unexpected image format: ${locale}/${slot}`);
    const src=`/assets/homepage-artwork/${locale}-${slot}.${extension}`;
    fs.writeFileSync(`public${src}`, bytes);
    if (extension === 'png' && (bytes.readUInt32BE(16)!==1080 || bytes.readUInt32BE(20)!==1920)) throw Error(`Unexpected full-resolution size: ${locale}/${slot}`);
    (artwork.assets[locale] ??= {})[`/assets/screens/${slot}.png`] = {src,language:locale,platform:'Android',kind:'store-illustration',width:1080,height:1920,source:{store:'Google Play',listingLocale:set.locale,screenNumber:index+1,url:downloadUrl},sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  }
  console.log(`${locale}: reused blocker, Schedule and Insights artwork`);
}
fs.writeFileSync('app/homepage-artwork.json',JSON.stringify(artwork,null,2)+'\n');
