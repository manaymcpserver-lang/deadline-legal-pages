// Final publication was explicitly authorized by the user on October 19, 2026.
// Do not convert machine drafts into reviewed content or claim certification.
import fs from 'node:fs';
const locales=JSON.parse(fs.readFileSync('app/guides/locales.json'));
const review=JSON.parse(fs.readFileSync('translations/legal/independent-review.json'));
const legalSource=JSON.parse(fs.readFileSync('translations/legal/source.json'));
if(review.sourceHash!==legalSource.sourceHash||review.pendingLocales.length||review.substantiveCriticalMeaningIssues.length||locales.filter(c=>c!=='en').some(c=>!review.completedLocales.includes(c)))throw Error('Independent critical policy review is incomplete');
const records=[];
for(const category of ['homepage','guides','legal']){
 const source=JSON.parse(fs.readFileSync(`translations/${category}/source.json`));
 for(const locale of locales.filter(c=>c!=='en')){
  const path=`translations/${category}/${locale}.json`,data=JSON.parse(fs.readFileSync(path));
  if(!['in-session-reviewed','approved'].includes(data.reviewStatus))throw Error(`${category}/${locale}: semantic review incomplete`);
  if(data.sourceHash!==source.sourceHash&&source.sourceHash)throw Error(`${category}/${locale}: stale source`);
  if(JSON.stringify(Object.keys(data.strings).sort())!==JSON.stringify([...source.strings].sort()))throw Error(`${category}/${locale}: incomplete dictionary`);
  if(data.unresolvedUnits?.length)throw Error(`${category}/${locale}: unresolved translations`);
  records.push({path,data,category,locale});
 }
}
for(const{path,data}of records){
 data.reviewStatus='approved';
 data.releaseApproval={date:'2026-10-19',basis:'User explicitly requested publication after translations and approved alignment of Terms with the current app',review:'AI-assisted in-session translation review and technical QA; not native-speaker or legal certification'};
 fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
}
fs.writeFileSync('translations/publication-approval.json',JSON.stringify({date:'2026-10-19',userAuthorizedPublication:true,paidTranslationServicesUsed:false,nativeSpeakerCertification:false,dictionaries:records.map(({category,locale})=>({category,locale})),englishPolicyUrlsPreserved:true},null,2)+'\n');
console.log(`Release-approved ${records.length} reviewed dictionaries; build and deployment checks remain required.`);
