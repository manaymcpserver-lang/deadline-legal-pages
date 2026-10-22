#!/usr/bin/env python3
"""Build reviewed, stored article translations using the existing guide renderer."""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("guides", ROOT / "scripts/localize-guides.py")
guides = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guides)
ARTICLE = "/guides/a-deadline-is-not-a-plan/"
DATA = ROOT / "translations/planning-guide"
LOCALES = json.loads((ROOT / "app/guides/planning-locales.json").read_text())
guides.PAGES = [ARTICLE]
guides.DATA = DATA
strings = guides.source_strings()
extra = ["Planning · School, work & everyday life", "Read the guide", "October 22, 2026", "Turn a deadline into a realistic work session. Use Nonlate to bring tasks together, plan when to start and interrupt distractions when unfinished work is due."]
strings = sorted(set(strings + extra))
source = {"sourceHash": guides.source_hash(strings), "strings": strings}

if len(sys.argv) > 1 and sys.argv[1] == "extract":
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / "source.json").write_text(json.dumps(source, ensure_ascii=False, indent=2) + "\n")
    baseline = json.loads((ROOT / "translations/guides/es.json").read_text())["strings"]
    print(json.dumps({index: value for index, value in enumerate(strings) if value not in baseline}, ensure_ascii=False, indent=2))
    sys.exit(0)

if len(sys.argv) > 1 and sys.argv[1] == "compose":
    review = json.loads((DATA / "manual/review.json").read_text())
    if review["sourceHash"] != source["sourceHash"] or set(review["locales"]) != set(LOCALES) - {"en"}:
        raise ValueError("Authored indexed translations need reconciliation and review for this source")
    for code in LOCALES:
        if code == "en":
            continue
        manual = json.loads((DATA / "manual" / f"{code}.json").read_text())
        baseline = json.loads((ROOT / "translations/guides" / f"{code}.json").read_text())["strings"]
        values = {value: baseline[value] for value in strings if value in baseline}
        for index, value in manual.items():
            values[strings[int(index)]] = value
        if set(values) != set(strings) or any(not value.strip() for value in values.values()):
            raise ValueError(f"{code}: missing units {set(strings) - set(values)}")
        result = {"locale": code, "sourceHash": source["sourceHash"], "reviewStatus": "approved",
                  "method": "direct AI-assisted translation with in-session semantic and technical review; not native-speaker certification",
                  "releaseApproval": {"date": "2026-10-22", "basis": "User requested translation and publication of the guide"}, "strings": values}
        (DATA / f"{code}.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print("Composed complete dictionaries from authored translations and reviewed shared site wording")
    sys.exit(0)

saved = json.loads((DATA / "source.json").read_text())
if saved != source:
    raise ValueError("Planning guide source changed; reconcile translations before building")

for code in LOCALES:
    if code == "en":
        continue
    guides.localize(ARTICLE, code, strings)
    destination = ROOT / "out" / guides.path_for(code, ARTICLE).strip("/") / "index.html"
    # Link the first guide in the reader's language too. Other missing article
    # translations keep their guide-index fallback from WebsiteLanguageMenu.
    html = destination.read_text()
    html = html.replace('href="/guides/"', f'href="/guides/{code}/"')
    html = html.replace('"item": "https://nonlate.app/guides/"', f'"item": "https://nonlate.app/guides/{code}/"')
    first = "/guides/block-distracting-apps-until-tasks-are-done/"
    html = html.replace(f'href="{first}"', f'href="/guides/{code}/block-distracting-apps-until-tasks-are-done/"')
    # Existing renderer preserves every footer language choice. Restore the
    # index fallback for languages without a reviewed translation of this post.
    for other in guides.LOCALES:
        if other not in LOCALES:
            html = html.replace(f'href="/guides/{other}/a-deadline-is-not-a-plan/"', f'href="/guides/{other}/"')
    destination.write_text(html)

    dictionary = json.loads((DATA / f"{code}.json").read_text())["strings"]
    index = ROOT / "out/guides" / code / "index.html"
    tree = guides.Tree(index.read_text()).root
    card = next(node for node in guides.descendants(tree) if node.tag == "article" and node.attrs.get("lang") == "en")
    card.attrs.update(lang=code, dir="rtl" if code in guides.RTL else "ltr")
    for node in guides.descendants(card):
        if node.tag is None:
            value = node.text.strip()
            if value == "Read in English":
                node.text = dictionary["Read the guide"] + " "
            elif value.endswith(" · English"):
                node.text = dictionary["Planning · School, work & everyday life"]
            elif value in dictionary:
                node.text = dictionary[value]
            elif value == "By Nonlate ·":
                node.text = dictionary["By"] + " Nonlate · "
        if node.tag == "a":
            node.attrs["href"] = guides.path_for(code, ARTICLE)
            node.attrs["hreflang"] = code
    index.write_text(guides.render(tree))

sitemap = ROOT / "out/sitemap.xml"
entries = "".join(f"  <url><loc>https://nonlate.app{guides.path_for(code, ARTICLE)}</loc></url>\n" for code in LOCALES if code != "en")
sitemap.write_text(sitemap.read_text().replace("</urlset>", entries + "</urlset>"))
print(f"Built {len(LOCALES) - 1} reviewed planning-guide translations")
