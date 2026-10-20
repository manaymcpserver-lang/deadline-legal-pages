"""Reconcile corrected website claims using existing app translations; no API."""
import json, hashlib, re, xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
APP=Path('/Users/manay/Desktop/DeadLine')
catalog=json.loads((APP/'DeadLine-iOS/DeadLine/Resources/Localizable.xcstrings').read_text())['strings']
source=json.loads((ROOT/'translations/homepage/source.json').read_text())['strings']
source_hash=hashlib.sha256(('['+', '.join(json.dumps(s,ensure_ascii=False) for s in source)+']').encode()).hexdigest()
aliases={'zh-Hans':'zh','zh-Hant':'zh-rTW','pt-BR':'pt-rBR','pt-PT':'pt-rPT','id':'in','he':'iw'}
locales=json.loads((ROOT/'app/guides/locales.json').read_text())
joined='Manual tasks and core blocking stay free. One source for 30 days. No payment or automatic charge. Change sources without restarting your trial.'
disclosure='One source for 30 days. No payment or automatic charge. Change sources without restarting your trial.'
expiry=json.loads((ROOT/'translations/trial-expiry.json').read_text())
for locale in locales:
    if locale=='en':continue
    directory=ROOT/'translations/homepage';file=directory/f'{locale}.json'
    data=json.loads(file.read_text());old=data['strings'];old_source=sorted(old)
    xml=ET.parse(APP/f'app/src/main/res/values-{aliases.get(locale,locale)}/source_trial.xml').getroot()
    app={n.attrib['name']:''.join(n.itertext()).replace("\\'", "'") for n in xml.findall('string')}
    free=old['Manual tasks and core blocking stay free']
    free=free if re.search(r'[.!?।。]$',free) else free+'.'
    additions={'30-day source trial':app['source_trial_title_not_started'],disclosure:app['source_trial_disclosure'],joined:free+' '+app['source_trial_disclosure'],'Drag tasks here':catalog['planner_drag_to_plan']['localizations'][locale]['stringUnit']['value'],expiry['en']:expiry[locale]}
    updated={key:additions.get(key,old.get(key)) for key in source}
    assert all(isinstance(v,str) and v.strip() for v in updated.values()),locale
    data['strings']=updated;data['sourceHash']=source_hash;data['trialCopyAligned']=True
    data['method']='In-session review plus existing app trial/Planner translations; not native-speaker certification. Final release approval remains separate.'
    file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    # Convert old indexed reviews to keyed reviews before source order changes.
    manual=directory/'manual'/f'{locale}.json'
    if manual.exists():
        previous=json.loads(manual.read_text())
        if 'byIndex' in previous:
            entries={old_source[int(i)]:v for i,v in previous['byIndex'].items()}
        else:entries=previous.get('strings',previous)
        reconciled={key:additions.get(key,entries.get(key,updated[key])) for key in source}
        manual.write_text(json.dumps({'strings':reconciled,'sourceHash':source_hash,'reviewNote':'Keyed reconciliation of trial claims and Planner drag instruction; final approval unchanged.'},ensure_ascii=False,indent=2)+'\n')
print(f'Aligned trial and Planner wording in English source and {len(locales)-1} existing translations; release approval unchanged.')
