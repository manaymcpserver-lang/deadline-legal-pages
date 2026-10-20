"""Prepare missing website illustrations from the original editable HTML.

Offline only: existing translations and explicitly reviewed supplements. No app,
store, icon, brand-name, video, or publication changes.
"""
import base64
import copy
import importlib.util
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = Path('/Users/manay/Desktop/DeadLine')
DEST = ROOT / 'translations/website-artwork'
DEST.mkdir(exist_ok=True)
spec = importlib.util.spec_from_file_location('htmltree', ROOT/'scripts/localize-guides.py')
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)
norm = lambda s: re.sub(r'\s+', ' ', s.replace("\\'", "'")).strip()
canonical = lambda s: norm(s).replace('’', "'").rstrip('.').casefold()
brands = {'Canvas','Notion','Slack','Google Tasks','Nonlate','Focus Lock','Aurora','Plus','Pro'}
catalog = json.loads((APP/'DeadLine-iOS/DeadLine/Resources/Localizable.xcstrings').read_text())['strings']
manifest = json.loads((ROOT/'app/homepage-artwork.json').read_text())
locales = json.loads((ROOT/'app/guides/locales.json').read_text())
sources = {}
ios = p.Tree((APP/'tmp/nonlate-app-store-screenshots-latest/Nonlate App Store Set.dc.html').read_text())
for slot, frame_id in [('ios-home','f1'),('ios-planner','f5'),('ios-blocker','f2')]:
    frame = next(n for n in p.descendants(ios.root) if n.attrs.get('id')==frame_id)
    sources[slot] = [n for n in frame.children if n.tag=='div'][1]
tasks_tree=p.Tree((APP/'tmp/nonlate-app-store-screenshots-claude/Nonlate App Store Set.dc.html').read_text())
tasks_frame=next(n for n in p.descendants(tasks_tree.root) if n.attrs.get('id')=='f5')
tasks=[n for n in tasks_frame.children if n.tag=='div'][1]
for node in p.descendants(tasks):
    if node.tag is None and node.text:
        node.text={'All (6)':'All (4)','Today (4)':'Today (2)','Tomorrow (2)':'Tomorrow (1)'}.get(norm(node.text),node.text)
    if node.tag=='div' and 'top:660px' in node.attrs.get('style',''): node.attrs['style']=node.attrs['style'].replace('top:660px','top:580px')
    if node.tag=='div' and node.attrs.get('style')=='zoom:2.72': node.attrs['style']='zoom:2.3'
    if node.tag=='div' and 'border-top:1px solid rgba(255,255,255,0.07); padding-top:18px' in node.attrs.get('style',''):
        rows=[]
        for title,date,brand,icon,color in [('Submit biology lab','Overdue · Aug 5','Canvas','canvas','#F07B6B'),('Project outline','Today · Aug 6 · 3:30 PM','Notion','notion','#F0A03C'),('Team brief','Tomorrow · Aug 7 · 10:00 AM','Slack','slack','#F0A03C'),('Read chapter 8','Aug 9 · 6:00 PM','Google Tasks','google_tasks','#F0A03C')]:
            rows.append(f'<div style="border-radius:24px;background:rgba(126,130,196,0.12);border:1px solid rgba(168,176,255,0.10);padding:18px;display:flex;align-items:center;gap:16px;min-height:120px"><img src="assets/integrations/{icon}.png" style="width:52px;height:52px;border-radius:14px;object-fit:contain;background:#fff;padding:5px;flex-shrink:0"><div style="flex:1;min-width:0"><div style="font-size:21px;font-weight:600;color:#fff">{title}</div><div style="margin-top:3px;font-size:17px;color:{color}">{date}</div><div style="margin-top:6px;display:inline-block;padding:4px 11px;border-radius:9px;background:rgba(164,148,255,0.16);font-size:14px;font-weight:600;color:#B9AFF8">{brand}</div></div><div style="width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);flex-shrink:0"></div></div>')
        node.children=p.Tree(''.join(rows)).root.children
sources['ios-tasks']=tasks
with zipfile.ZipFile(APP/'Nonlate play store Screenshots.zip') as z:
    android = p.Tree(z.read('Nonlate Android App Store Set.dc.html').decode())
    extra = p.Tree(z.read('Nonlate App Store Set v2.dc.html').decode())
    app_icon = z.read('assets/app-icon.png')
for slot, frame_id, tree in [('android-blocker','a2',android),('android-schedule','f10',extra),('android-insights','a8',android)]:
    frame = next(n for n in p.descendants(tree.root) if n.attrs.get('id')==frame_id)
    sources[slot] = [n for n in frame.children if n.tag=='div'][1]
# Materialize the original template's 30-day chart rather than leaving its
# design-tool-only loop unresolved in a standalone browser render.
for node in list(p.descendants(sources['android-insights'])):
    for child in list(node.children):
        if child.tag=='sc-for':
            colors=['#7ED9A0','#7ED9A0','rgba(255,255,255,0.10)','#7ED9A0','#F09080','#7ED9A0','#7ED9A0','rgba(255,255,255,0.10)','#7ED9A0','#7ED9A0','#7ED9A0','rgba(255,255,255,0.10)','#F09080','#7ED9A0','#7ED9A0','#7ED9A0','rgba(255,255,255,0.10)','#7ED9A0','#7ED9A0','#F09080','#7ED9A0','rgba(255,255,255,0.10)','#7ED9A0','#7ED9A0','#7ED9A0','rgba(255,255,255,0.10)','#7ED9A0','#F09080','#7ED9A0','#7ED9A0']
            index=node.children.index(child)
            node.children[index:index+1]=[p.Node('div',[('style',f'height:11px;border-radius:3px;background:{color}')]) for color in colors]

def xml_resources(directory):
    result = {}
    for file in directory.glob('*.xml'):
        for node in ET.parse(file).getroot().findall('string'):
            result[node.attrib['name']] = norm(''.join(node.itertext()))
    return result

english = xml_resources(APP/'app/src/main/res/values')
supplement_file = DEST/'supplement.json'
supplements = json.loads(supplement_file.read_text()) if supplement_file.exists() else {}
headlines=json.loads((DEST/'task-headlines.json').read_text())
dates_file=DEST/'dates.json'
dates=json.loads(dates_file.read_text()) if dates_file.exists() else {}
report = []
for locale in locales:
    if locale=='en': continue
    # Previously named "one-list" files in 17 locales actually contain Schedule;
    # regenerate Tasks for every translated locale from the verified Tasks layout.
    missing_slots = [slot for slot in sources if slot=='ios-tasks' or (locale in {'fa','fil'} and slot.startswith('ios')) or (locale=='or' and slot.startswith('android')) or f'/assets/screens/{slot}.png' not in manifest['assets'].get(locale,{})]
    if not missing_slots: continue
    values = dict(json.loads((ROOT/f'translations/homepage/{locale}.json').read_text())['strings'])
    alias = {'zh-Hans':'zh','zh-Hant':'zh-rTW','pt-BR':'pt-rBR','pt-PT':'pt-rPT','id':'in','he':'iw'}.get(locale,locale)
    translated = xml_resources(APP/f'app/src/main/res/values-{alias}')
    for key, source in english.items():
        if key in translated: values.setdefault(source, translated[key])
    for key, entry in catalog.items():
        source = entry.get('localizations',{}).get('en',{}).get('stringUnit',{}).get('value',key)
        target = entry.get('localizations',{}).get(locale,{}).get('stringUnit',{}).get('value')
        if target: values.setdefault(norm(source),target)
    prior = APP/f'release/ios-localization-expansion/{"no" if locale=="nb" else locale}/source/translations.json'
    if prior.exists(): values.update(json.loads(prior.read_text()))
    values.update(supplements.get(locale,{}))
    for source,key in [('Tap + to add to plan','planner_drag_to_plan'),('Scroll here, keep the day above','planner_scroll_tasks_keep_day'),('Swipe for later dates','planner_swipe_later_dates')]:
        target=catalog.get(key,{}).get('localizations',{}).get(locale,{}).get('stringUnit',{}).get('value')
        if target: values[source]=target
    values.update(dict(zip(['One list for every source','Imported tasks and your own reminders, together.'],headlines[locale])))
    def term(source):
        return next((v for k,v in values.items() if canonical(k)==canonical(source)),None)
    for source,base,count in [('All (4)','All',4),('Today (2)','Today',2),('Tomorrow (1)','Tomorrow',1)]:
        if term(base): values[source]=f'{term(base)} ({count})'
    if locale in dates:
        for source,base,day,time in [('Overdue · Aug 5','Overdue',5,''),('Today · Aug 6 · 3:30 PM','Today',6,'15:30'),('Tomorrow · Aug 7 · 10:00 AM','Tomorrow',7,'10:00')]:
            if term(base): values[source]=f'{term(base)} · {dates[locale][str(day)]}'+(f' · {time}' if time else '')
        values['Aug 9 · 6:00 PM']=dates[locale]['9']+' · 18:00'
    values.update({'10:30–11:45 AM':'10:30–11:45','9:00–10:00 AM':'09:00–10:00','1 PM':'13:00','11 AM':'11:00','3 PM':'15:00','9 AM':'09:00','12:00 – 2:00 PM':'12:00 – 14:00','9:00 – 10:15 AM':'09:00 – 10:15'})
    index = {canonical(k):v for k,v in values.items()}
    for source, key in [('One list for every source','One list for every source'),('Imported tasks and your own reminders, together.','Imported tasks and your own reminders, together.')]:
        if source in values: index[canonical(source)]=values[source]
    for slot in missing_slots:
        frame = copy.deepcopy(sources[slot])
        if slot=='ios-tasks':
            for node in p.descendants(frame):
                style=node.attrs.get('style','')
                if node.tag=='div' and len(node.children)==1 and node.children[0].tag is None:
                    text=norm(node.children[0].text or '')
                    if text in {'Submit biology lab','Project outline','Team brief','Read chapter 8'}: node.attrs['data-task-title']='true'
                    if text in {'Overdue · Aug 5','Today · Aug 6 · 3:30 PM','Tomorrow · Aug 7 · 10:00 AM','Aug 9 · 6:00 PM'}: node.attrs['data-task-date']='true'
        texts = sorted({norm(n.text) for n in p.descendants(frame) if n.tag is None and n.text and re.search('[A-Za-z]',n.text) and not any(x in n.text for x in ['{','}'])})
        required = [s for s in texts if s not in brands and not re.match(r'^\d{2}\s*·',s)]
        missing = [s for s in required if canonical(s) not in index]
        item = {'locale':locale,'slot':slot,'missing':missing,'sourceTexts':texts}
        report.append(item)
        if missing: continue
        for node in p.descendants(frame):
            # CSS background icons are just as important as <img> icons.
            if 'assets/' in node.attrs.get('style',''):
                def embed_background(match):
                    image=APP/'tmp/nonlate-app-store-screenshots-latest'/match.group(1)
                    if not image.exists(): raise ValueError(f'Missing original icon: {image}')
                    return 'url("data:image/png;base64,'+base64.b64encode(image.read_bytes()).decode()+'")'
                node.attrs['style']=re.sub(r'url\([\'"]?(assets/[^\'"\)]+)[\'"]?\)',embed_background,node.attrs['style'])
            if node.tag is None and node.text:
                text=norm(node.text)
                if text and text not in brands and canonical(text) in index:
                    node.text=index[canonical(text)].replace("\\'", "'")
            if node.tag in {'div','span'} and len(node.children)==1 and node.children[0].tag is None and re.search(r'[^\W\d_]',node.children[0].text or '',re.UNICODE):
                node.attrs['dir']='auto'
            if node.tag=='img':
                src=node.attrs.get('src','')
                image = APP/'tmp/nonlate-app-store-screenshots-latest'/src
                if src=='assets/app-icon.png' and slot.startswith('android'):
                    node.attrs['src']='data:image/png;base64,'+base64.b64encode(app_icon).decode()
                elif src and not src.startswith('data:') and image.exists():
                    node.attrs['src']='data:image/png;base64,'+base64.b64encode(image.read_bytes()).decode()
            # Android's original shared schedule mockup must not acquire an iPhone island.
            if slot=='android-schedule' and node.tag=='div' and 'width:125px; height:37px; background:#000' in node.attrs.get('style',''):
                node.attrs['style']='position:absolute;top:18px;left:0;right:0;margin:0 auto;width:14px;height:14px;background:#03050A;border:2px solid #252936;border-radius:50%;z-index:6'
        size = re.search(r'width:(\d+)px; height:(\d+)px',frame.attrs['style'])
        w,h=map(int,size.groups())
        # Preserve all icons and illustration structure; fit longer translated text.
        rtl = locale in {'fa','ar','he','ur'}
        style=f'body{{margin:0;width:{w}px;height:{h}px;overflow:hidden}}*{{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif}}'
        document=f'<!doctype html><html lang="{locale}"><meta charset="utf-8"><style>{style}</style><body>{p.render(frame)}</body></html>'
        folder=DEST/locale;folder.mkdir(exist_ok=True)
        (folder/f'{slot}.html').write_text(document)
        item.update(width=w,height=h,file=str(folder/f'{slot}.html'))
(DEST/'preparation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'images':len(report),'ready':sum(not x['missing'] for x in report),'missingBySlot':{slot:sorted({s for x in report if x['slot']==slot for s in x['missing']}) for slot in sources},'missingLocales':{x['locale']:x['missing'] for x in report if x['slot']=='ios-tasks'}},ensure_ascii=False,indent=2))
