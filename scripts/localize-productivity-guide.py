#!/usr/bin/env python3
"""Build all supported locales from authored, source-checked article copy.

Reuse the site's existing translator-free renderer and reviewed shared wording.
No translation model, network service, or draft override runs during builds.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("guides", ROOT / "scripts/localize-guides.py")
guides = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guides)
ARTICLE = "/guides/best-productivity-app/"
DATA = ROOT / "translations/productivity-guide"
copy = json.loads((DATA / "copy.json").read_text())
if set(copy) != set(guides.LOCALES):
    raise ValueError(f"Locale mismatch: {set(guides.LOCALES) ^ set(copy)}")
keys = list(copy["en"])
guides.PAGES = [ARTICLE]
guides.DATA = DATA
strings = guides.source_strings()
source = {"sourceHash": guides.source_hash(strings), "strings": strings}

if len(sys.argv) > 1 and sys.argv[1] == "compose":
    for code in guides.LOCALES:
        if code == "en":
            continue
        units = copy[code]
        if len(units) != len(keys) or any(not isinstance(unit, str) or not unit.strip() for unit in units):
            raise ValueError(f"Incomplete authored copy: {code}")
        baseline = json.loads((ROOT / "translations/guides" / f"{code}.json").read_text())["strings"]
        translated = {copy["en"][key]: value for key, value in zip(keys, units)}
        translated[copy["en"]["title"] + " | Nonlate"] = units[0] + " | Nonlate"
        translated["Nonlate ·"] = "Nonlate ·"
        values = {original: translated.get(original, baseline.get(original)) for original in strings}
        missing = [key for key, value in values.items() if not value]
        if missing:
            raise ValueError(f"{code}: unreconciled source units: {missing}")
        record = {"locale": code, "sourceHash": source["sourceHash"], "reviewStatus": "approved",
                  "method": "Direct AI-assisted translation with in-session semantic and technical review; not native-speaker certification.",
                  "releaseApproval": {"date": "2026-10-24", "basis": "User requested guide publication in all website languages."}, "strings": values}
        (DATA / f"{code}.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n")
    (DATA / "source.json").write_text(json.dumps(source, ensure_ascii=False, indent=2) + "\n")
    print("Composed 46 complete article dictionaries")
    sys.exit(0)

if json.loads((DATA / "source.json").read_text()) != source:
    raise ValueError("Productivity article source changed; reconcile translations before publishing")

for code in guides.LOCALES:
    if code == "en":
        continue
    dictionary = json.loads((DATA / f"{code}.json").read_text())["strings"]
    authored = dict(zip(keys, copy[code]))
    if any(dictionary[copy["en"][key]] != authored[key] for key in keys):
        raise ValueError(f"{code}: copy changed; recompose and review before publishing")
    guides.localize(ARTICLE, code, strings)
    destination = ROOT / "out" / guides.path_for(code, ARTICLE).strip("/") / "index.html"
    html = destination.read_text().replace('href="/guides/"', f'href="/guides/{code}/"')
    html = html.replace('"item": "https://nonlate.app/guides/"', f'"item": "https://nonlate.app/guides/{code}/"')
    first = "/guides/block-distracting-apps-until-tasks-are-done/"
    html = html.replace(f'href="{first}"', f'href="{guides.path_for(code, first)}"')
    destination.write_text(html)
    index = ROOT / "out/guides" / code / "index.html"
    tree = guides.Tree(index.read_text()).root
    card = next(node for node in guides.descendants(tree) if node.attrs.get("data-guide") == "productivity")
    card.attrs.update(lang=code, dir="rtl" if code in guides.RTL else "ltr")
    shared = json.loads((ROOT / "translations/guides" / f"{code}.json").read_text())["strings"]
    for node in guides.descendants(card):
        if node.tag is None:
            original = node.text.strip()
            if original in dictionary:
                node.text = dictionary[original] + (" " if node.text.endswith(" ") else "")
            elif original in shared:
                node.text = shared[original] + (" " if node.text.endswith(" ") else "")
        elif node.tag == "a":
            node.attrs.update(href=guides.path_for(code, ARTICLE), hreflang=code)
    index.write_text(guides.render(tree))

sitemap = ROOT / "out/sitemap.xml"
entries = "".join(f"  <url><loc>https://nonlate.app{guides.path_for(code, ARTICLE)}</loc></url>\n" for code in guides.LOCALES if code != "en")
sitemap.write_text(sitemap.read_text().replace("</urlset>", entries + "</urlset>"))
print("Built 46 translated productivity guides and localized index cards")
