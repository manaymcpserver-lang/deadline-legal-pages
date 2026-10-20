"""Static localized policy/help pages. Original English URLs remain valid.

No translator runs during a build. Locale dictionaries are source-hash checked;
links, contact addresses, security terms and original policy dates are retained.
"""
import argparse
import copy
import importlib.util
import json
import os
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('guide_html',ROOT/'scripts/localize-guides.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
DATA=ROOT/'translations/legal'
PAGES=['/privacy/','/terms/','/support/','/data-deletion/']

def destination(locale,path):
    return path if locale=='en' else f'/{locale}{path}'

def extract():
    strings={p.NOTE,'English version','Language','Available languages','Home','Guides'}
    for route in PAGES:
        root=p.Tree((ROOT/'out'/route.strip('/')/'index.html').read_text()).root
        def walk(node,grouped=False):
            if node.tag in {'script','style'} or 'data-language-switcher' in node.attrs:return
            if not grouped and p.paragraph_unit(node) and p.useful(p.text_content(node)):
                strings.add(p.text_content(node).strip());grouped=True
                for child in p.descendants(node):
                    if child.tag=='a' and p.useful(p.text_content(child)):strings.add(p.text_content(child).strip())
            if node.tag is None and not grouped and p.useful(node.text):strings.add(node.text.strip())
            for key,value in node.attrs.items():
                if key in {'aria-label','alt','title'} and value and p.useful(value):strings.add(value.strip())
                if node.tag=='meta' and key=='content' and node.attrs.get('name',node.attrs.get('property')) in {'description','og:title','og:description','twitter:title','twitter:description','og:image:alt'}:strings.add(value.strip())
            if node.tag=='title':strings.add(p.text_content(node).strip())
            for child in node.children:walk(child,grouped)
        walk(root)
    return sorted(strings)

def build(strings,locales=None):
    for locale in locales or p.LOCALES:
        if locale=='en':continue
        document=json.loads((DATA/f'{locale}.json').read_text())
        allow_draft=os.environ.get('NONLATE_TRANSLATION_DRAFT')=='1'
        if document.get('reviewStatus')!='approved' and not allow_draft:raise ValueError(f'{locale}: policy translation not release-approved')
        if document['sourceHash']!=p.source_hash(strings) or set(document['strings'])!=set(strings):raise ValueError(f'{locale}: stale policy dictionary')
        values=document['strings']
        def tr(text):
            stripped=text.strip()
            return text[:len(text)-len(text.lstrip())]+values.get(stripped,stripped)+text[len(text.rstrip()):]
        def href(value):
            if value in PAGES:return destination(locale,value)
            if value=='/' or value.startswith('/#'):return f'/{locale}/'+value[1:]
            if value=='/guides/':return f'/guides/{locale}/'
            return value
        for route in PAGES:
            root=p.Tree((ROOT/'out'/route.strip('/')/'index.html').read_text()).root
            def walk(node):
                if node.tag=='script':return False
                if node.tag=='link' and (node.attrs.get('as')=='script' or node.attrs.get('rel')=='modulepreload'):return False
                if node.tag=='html':node.attrs.update(lang=locale,dir='rtl' if locale in p.RTL else 'ltr')
                if 'data-language-switcher' in node.attrs:
                    for n in p.descendants(node):
                        if n.tag=='summary':n.children=[p.Node(text=values['Language']+' · '+p.NATIVE[locale])]
                        if n.tag=='a' and n.attrs.get('lang') in p.LOCALES:
                            code=n.attrs['lang'];n.attrs['href']=destination(code,route)
                            n.attrs.pop('aria-current',None)
                            if code==locale:n.attrs['aria-current']='page'
                    return True
                if node.tag is None:node.text=tr(node.text);return True
                for key,value in list(node.attrs.items()):
                    if not value:continue
                    if key in {'aria-label','alt','title'}:node.attrs[key]=tr(value)
                    if key=='href':node.attrs[key]=href(value)
                    if node.tag=='meta' and key=='content':
                        kind=node.attrs.get('name',node.attrs.get('property',''))
                        if kind in {'description','og:title','og:description','twitter:title','twitter:description','og:image:alt'}:node.attrs[key]=tr(value)
                        if kind=='og:url':node.attrs[key]=p.ORIGIN+destination(locale,route)
                        if kind=='robots' and document.get('reviewStatus')!='approved':node.attrs[key]='noindex, nofollow'
                    if node.tag=='link' and node.attrs.get('rel')=='canonical':node.attrs['href']=p.ORIGIN+destination(locale,route)
                if p.paragraph_unit(node) and p.useful(p.text_content(node)):
                    sentence=tr(p.text_content(node).strip())
                    links=[copy.deepcopy(n) for n in p.descendants(node) if n.tag in {'a','code'}]
                    rebuilt=[p.Node(text=sentence)]
                    for link in links:
                        label=tr(p.text_content(link).strip());link.children=[p.Node(text=label)]
                        if 'href' in link.attrs:link.attrs['href']=href(link.attrs['href'])
                        for index,part in enumerate(rebuilt):
                            if part.tag is None and label in part.text:
                                before,after=part.text.split(label,1);rebuilt[index:index+1]=[p.Node(text=before),link,p.Node(text=after)];break
                        else:rebuilt.extend([p.Node(text=' ('),link,p.Node(text=')')])
                    node.children=rebuilt
                else:node.children=[child for child in node.children if walk(child)]
                if node.tag=='header' and node.attrs.get('class','').startswith('site-header'):
                    node.children=p.Tree(f'<div class="nav-shell"><a class="brand" href="/{locale}/"><img src="/assets/nonlate-icon.png" width="38" height="38" alt=""><span>Nonlate</span></a><nav class="guide-static-nav"><a href="/{locale}/">{values["Home"]}</a><a href="/guides/{locale}/">{values["Guides"]}</a></nav></div>').root.children
                return True
            walk(root)
            head=next(n for n in p.descendants(root) if n.tag=='head')
            for code in p.LOCALES:
                head.children.append(p.Node('link',[('rel','alternate'),('hreflang','tl' if code=='fil' else code),('href',p.ORIGIN+destination(code,route))]))
            head.children.append(p.Node('link',[('rel','alternate'),('hreflang','x-default'),('href',p.ORIGIN+route)]))
            main=next(n for n in p.descendants(root) if n.tag=='main')
            note=p.Node('p',[('class','guide-translation-note')]);note.children=[p.Node(text=values[p.NOTE]+' '),p.Node('a',[('href',route),('hreflang','en')])];note.children[1].children=[p.Node(text=values['English version'])];main.children.append(note)
            file=ROOT/'out'/destination(locale,route).strip('/')/'index.html';file.parent.mkdir(parents=True,exist_ok=True);file.write_text(p.render(root))
    # English pages also switch to translations of the same policy, not home.
    for route in PAGES:
        # Do not parse/reserialize Next's English hydration markup or comments.
        # WebsiteLanguageMenu already renders the correct same-page destinations.
        file=ROOT/'out'/route.strip('/')/'index.html';html=file.read_text()
        links=''.join(f'<link rel="alternate" hreflang="{"tl" if code=="fil" else code}" href="{p.ORIGIN}{destination(code,route)}">' for code in p.LOCALES)
        links+=f'<link rel="alternate" hreflang="x-default" href="{p.ORIGIN}{route}">'
        file.write_text(html.replace('</head>',links+'</head>',1))
    print(f'Built {4*len([code for code in (locales or p.LOCALES) if code!="en"])} localized privacy, terms, support and deletion pages')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('command',choices=['extract','build']);parser.add_argument('--locales',nargs='+');args=parser.parse_args()
    strings=extract()
    if args.command=='extract':
        DATA.mkdir(exist_ok=True);(DATA/'source.json').write_text(json.dumps({'sourceHash':p.source_hash(strings),'strings':strings},ensure_ascii=False,indent=2)+'\n');print(f'{len(strings)} source units; {sum(map(len,strings))} characters')
    else:build(strings,args.locales)
