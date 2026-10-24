// Reproducible social card using the site's existing brand and screenshot assets.
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
<defs><radialGradient id="glow"><stop stop-color="#25204b"/><stop offset="1" stop-color="#080b13"/></radialGradient></defs>
<rect width="1536" height="1024" fill="#080b13"/>
<ellipse cx="1190" cy="540" rx="650" ry="740" fill="url(#glow)"/>
<g font-family="Arial, Helvetica, sans-serif">
<text x="166" y="144" fill="#f5f5ff" font-size="48" font-weight="700">Nonlate</text>
<text x="72" y="327" fill="#f5f5ff" font-size="88" font-weight="700" letter-spacing="-3">More connected.</text>
<text x="72" y="432" fill="#b8a5ff" font-size="88" font-weight="700" letter-spacing="-3">Less distracted.</text>
<text x="76" y="527" fill="#c6cbd9" font-size="36">Tasks, calendars and plans together.</text>
<text x="76" y="584" fill="#c6cbd9" font-size="36">Block selected distractions</text>
<text x="76" y="633" fill="#c6cbd9" font-size="36">when work is due.</text>
<rect x="76" y="698" width="770" height="98" rx="24" fill="#131927" stroke="#2b3349"/>
<text x="100" y="757" fill="#e3e6f3" font-size="30" font-weight="700">20+ integrations</text>
<text x="76" y="891" fill="#f5f5ff" font-size="30">Available on iOS and Android</text>
<text x="76" y="946" fill="#8e9bb6" font-size="28">nonlate.app</text>
</g></svg>`);
(async () => {
  const icon = await sharp(path.join(root, 'public/assets/nonlate-icon.png')).resize(68, 68).png().toBuffer();
  const phone = await sharp(path.join(root, 'public/assets/screens/ios-blocker.png'))
    .extract({left:62,top:310,width:612,height:1264}).resize(440,909).png().toBuffer();
  const names = ['notion','todoist','google_tasks','canvas','google_calendar'];
  const icons = await Promise.all(names.map(async (name, i) => ({
    input: await sharp(path.join(root, `public/assets/integrations/${name}.png`)).resize(42,42,{fit:'contain',background:'#ffffff'}).flatten({background:'#ffffff'}).extend({top:4,bottom:4,left:4,right:4,background:'#ffffff'}).png().toBuffer(),
    left: 424 + i*76, top:722,
  })));
  const card = await sharp(svg).composite([{input:icon,left:76,top:88},{input:phone,left:1020,top:58},...icons]).png().toBuffer();
  await fs.writeFile(path.join(root,'public/og-launch-2026-10.png'),card);
  // Keep older links valid, without retaining the obsolete coming-soon artwork.
  await fs.writeFile(path.join(root,'public/og.png'),card);
})();
