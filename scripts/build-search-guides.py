#!/usr/bin/env python3
"""Export reviewed intent guides using the existing, same-language site shell.

Runs after existing article localizers and before language-suggestion injection.
No network calls or runtime translations. Existing translation hashes stay intact.
"""
import hashlib
import html
import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("guides", ROOT / "scripts/localize-guides.py")
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)
DATA = ROOT / "app/guides/search-content"
ORIGIN = "https://nonlate.app"
PILLAR = "block-distracting-apps-until-tasks-are-done"
PLANNING = "a-deadline-is-not-a-plan"
PLANNING_LOCALES = json.loads((ROOT / "app/guides/planning-locales.json").read_text())
RELATED_LINKS = json.loads((ROOT / "app/guides/related-links.json").read_text())
UI = json.loads((ROOT / "app/guides/search-ui.json").read_text())
INDEX = json.loads((ROOT / "app/guides/topics.json").read_text())
SHARED_TERMS = {"Nonlate", "Canvas", "Google Classroom", "Todoist", "Plus", "Pro", "Focus Lock", "iPhone", "iOS", "Android", "App Store", "Google Play", "Live Sync", "Screen Time", "Planner", "Schedule", "Home", "FAQ"}


def esc(value):
    return html.escape(value, quote=True)


def route(locale, slug=""):
    return f'/guides/{"" if locale == "en" else locale + "/"}{slug + "/" if slug else ""}'


def hreflang(locale):
    return "tl" if locale == "fil" else locale


def fragment(markup):
    return g.Tree(markup).root.children


def static_shell(tree, locale, remove_alternates=False):
    """Prevent React hydration from restoring an older article/index body."""
    def clean(node):
        node.children = [c for c in node.children if c.tag != "script" and not (c.tag == "link" and (c.attrs.get("as") == "script" or (remove_alternates and c.attrs.get("rel") == "alternate")))]
        for child in node.children:
            clean(child)
    clean(tree)
    ui = UI.get(locale)
    # Non-English shells already contain the localized, script-free header.
    if ui and locale == "en":
        for node in g.descendants(tree):
            if node.tag == "header" and node.attrs.get("class", "").startswith("site-header"):
                node.children = fragment(f'<div class="nav-shell"><a class="brand" href="/"><img src="/assets/nonlate-icon.png" width="38" height="38" alt=""><span>Nonlate</span></a><nav class="guide-static-nav" aria-label="{ui["guides"]}"><a href="/">{ui["home"]}</a><a href="/guides/">{ui["guides"]}</a></nav></div>')


def language_menu(guide, locale, css="guide-languages"):
    links = "".join(f'<a href="{route(code, guide["slug"])}" lang="{code}" hreflang="{hreflang(code)}"' + (' aria-current="page"' if code == locale else '') + f'>{esc(g.NATIVE[code])}</a>' for code in guide["locales"])
    return f'<details class="{css}"><summary>{UI[locale]["language"]} · {esc(g.NATIVE[locale])}</summary><nav aria-label="{UI[locale]["language"]}">{links}</nav></details>'


def load_guides():
    reviews = json.loads((DATA / "reviews.json").read_text())
    if set(UI) != set(g.LOCALES):
        raise ValueError("Guide interface must cover every supported website language")
    for code, labels in UI.items():
        if set(labels) != set(UI["en"]) or any(not isinstance(value, str) or not value.strip() for value in labels.values()):
            raise ValueError(f"Incomplete guide interface: {code}")
    if reviews.get("uiSha256") != hashlib.sha256((ROOT / "app/guides/search-ui.json").read_bytes()).hexdigest():
        raise ValueError("Guide interface changed; review localized labels before publication")
    guides = []
    for path in sorted(DATA.glob("*.json")):
        if path.name == "reviews.json":
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        review = reviews["files"].get(path.name, {})
        if review.get("sha256") != digest or review.get("status") != "reviewed":
            raise ValueError(f"Unreviewed or changed search guide: {path.name}")
        guide = json.loads(path.read_text())
        if not re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)*", guide["slug"]):
            raise ValueError("Invalid guide slug")
        if set(guide["locales"]) != set(g.LOCALES) or set(review["locales"]) != set(g.LOCALES):
            raise ValueError(f"Every guide must cover all {len(g.LOCALES)} supported languages: {path.name}")
        baseline = guide["locales"]["en"]
        for code, copy in guide["locales"].items():
            if code not in UI or set(copy) != set(baseline):
                raise ValueError(f"Incomplete locale structure: {code}")
            if [s["id"] for s in copy["sections"]] != [s["id"] for s in baseline["sections"]]:
                raise ValueError(f"Section mismatch: {code}")
            ids = [s["id"] for s in copy["sections"]]
            if len(ids) != len(set(ids)) or any(not re.fullmatch(r"[a-z]+(?:-[a-z]+)*", s) for s in ids) or set(ids) & {"quick-answer", "questions", "related", "sources"}:
                raise ValueError("Invalid or duplicate section IDs")
            if len(copy["faq"]) != len(baseline["faq"]):
                raise ValueError(f"Incomplete FAQ: {code}")
            for original, translated in zip(baseline["sections"], copy["sections"]):
                if set(original) != set(translated) or len(original["paragraphs"]) != len(translated["paragraphs"]) or len(original.get("steps", [])) != len(translated.get("steps", [])):
                    raise ValueError(f"Incomplete section: {code}")
            def check(value):
                if isinstance(value, str) and (not value.strip() or re.search(r"<[/a-zA-Z]|⟦NL|NONLATEX\d+TOKEN", value)):
                    raise ValueError(f"Invalid content: {code}")
                if isinstance(value, dict):
                    for child in value.values():
                        check(child)
                if isinstance(value, list):
                    for child in value:
                        check(child)
            check(copy)
            if code != "en":
                def prose(value):
                    if isinstance(value, str):
                        return [value]
                    if isinstance(value, list):
                        return [s for child in value for s in prose(child)]
                    return [s for key in sorted(value) if key != "id" for s in prose(value[key])]
                original, translated = prose(baseline), prose(copy)
                unchanged = [a for a, b in zip(original, translated) if a == b and a not in SHARED_TERMS and re.search(r"[A-Za-z]", a) and not re.match(r"^(?:https?://|mailto:)", a)]
                if unchanged:
                    raise ValueError(f"Untranslated article copy: {code}: {unchanged[0]}")
        guides.append(guide)
    if not guides or len({guide["slug"] for guide in guides}) != len(guides):
        raise ValueError("Missing or duplicate search guides")
    slugs = {guide["slug"] for guide in guides}
    for guide in guides:
        related = guide["related"]
        if (not related or len(set(related)) != len(related) or guide["slug"] in related
                or set(related) - (slugs | {PILLAR})):
            raise ValueError(f'Invalid related guides: {guide["slug"]}')
    return guides


def article_markup(guide, locale, guides_by_slug):
    t, ui = guide["locales"][locale], UI[locale]
    home = "/" if locale == "en" else f"/{locale}/"
    updated = guide.get("updated", guide["published"])
    parts = [language_menu(guide, locale), f'<nav class="guide-breadcrumb" aria-label="{ui["guides"]}"><a href="{home}">{ui["home"]}</a><span aria-hidden="true">/</span><a href="{route(locale)}">{ui["guides"]}</a></nav>', '<article class="guide-article">', f'<header class="guides-heading"><p class="eyebrow">Nonlate · iPhone &amp; Android</p><h1>{esc(t["title"])}</h1><p>{esc(t["intro"])}</p><p class="guide-byline">Nonlate · <time datetime="{updated}">{updated}</time></p><p class="guide-disclosure">{esc(ui["disclosure"])}</p></header>', f'<section class="guide-answer" id="quick-answer"><h2>{ui["answer"]}</h2><p>{esc(t["answer"])}</p></section>', f'<nav class="guide-toc" aria-label="{ui["toc"]}"><h2>{ui["toc"]}</h2><ul>']
    parts.extend(f'<li><a href="#{s["id"]}">{esc(s["heading"])}</a></li>' for s in t["sections"])
    parts.append(f'<li><a href="#questions">{ui["faq"]}</a></li></ul></nav>')
    for section in t["sections"]:
        parts.append(f'<section id="{section["id"]}"><h2>{esc(section["heading"])}</h2>')
        parts.extend(f'<p>{esc(p)}</p>' for p in section["paragraphs"])
        if section.get("steps"):
            parts.append('<ol class="guide-steps">' + ''.join(f'<li>{esc(step)}</li>' for step in section["steps"]) + '</ol>')
        parts.append('</section>')
    parts.append(f'<section id="questions"><h2>{ui["faq"]}</h2>')
    parts.extend(f'<h3>{esc(item["question"])}</h3><p>{esc(item["answer"])}</p>' for item in t["faq"])
    parts.append(f'</section><div class="guide-downloads"><a class="guide-read-link" href="https://apps.apple.com/app/id6759996284">{ui["app"]}</a><br><a class="guide-read-link" href="https://play.google.com/store/apps/details?id=com.nonlate.app">{ui["play"]}</a><br><a href="{home}#plans">{ui["plans"]}</a></div>')
    parts.append(f'<nav id="related" class="guide-toc" aria-label="{ui["related"]}"><h2>{ui["related"]}</h2><ul>')
    for slug in guide["related"]:
        if slug == PILLAR:
            title = "How to block distracting apps until your tasks are done"
            if locale != "en":
                pillar = ROOT / "translations/guides" / f"{locale}.json"
                title = json.loads(pillar.read_text())["strings"][title]
        else:
            title = guides_by_slug[slug]["locales"][locale]["title"]
        parts.append(f'<li><a href="{route(locale, slug)}" hreflang="{hreflang(locale)}">{esc(title)}</a></li>')
    parts.append('</ul></nav>')
    if guide.get("sources"):
        parts.append(f'<section id="sources" class="guide-notes"><h2>{ui["sources"]}</h2><ul>')
        # Source titles retain their original language, explicitly labelled.
        parts.extend(f'<li><a href="{esc(s["url"])}" lang="en" hreflang="en" dir="ltr">{esc(s["label"])}</a></li>' for s in guide["sources"])
        parts.append('</ul></section>')
    parts.append('</article>')
    if locale != "en":
        parts.append(f'<p class="guide-translation-note">{ui["translation"]} <a href="{route("en", guide["slug"])}" hreflang="en" lang="en">English</a></p>')
    arrow = "→" if locale in g.RTL else "←"
    parts.append(f'<a class="guide-back" href="{route(locale)}">{arrow} {ui["back"]}</a>')
    return ''.join(parts)


def build_article(guide, locale, guides_by_slug):
    t, ui = guide["locales"][locale], UI[locale]
    updated = guide.get("updated", guide["published"])
    canonical = ORIGIN + route(locale, guide["slug"])
    tree = g.Tree((ROOT / "out" / g.path_for(locale, g.ARTICLE).strip("/") / "index.html").read_text()).root
    static_shell(tree, locale, remove_alternates=True)
    for node in g.descendants(tree):
        if node.tag == "title":
            node.children = [g.Node(text=t["title"] + " | Nonlate")]
        if node.tag == "meta":
            name = node.attrs.get("name", node.attrs.get("property"))
            if name in {"description", "og:description", "twitter:description"}:
                node.attrs["content"] = t["description"]
            elif name in {"og:title", "twitter:title"}:
                node.attrs["content"] = t["title"]
            elif name == "og:url":
                node.attrs["content"] = canonical
            elif name == "article:published_time":
                node.attrs["content"] = guide["published"]
            elif name == "article:modified_time":
                node.attrs["content"] = updated
        if node.tag == "link" and node.attrs.get("rel") == "canonical":
            node.attrs["href"] = canonical
        if node.tag == "main":
            node.children = fragment(article_markup(guide, locale, guides_by_slug))
        if node.tag == "header" and node.attrs.get("class", "").startswith("site-header"):
            home = "/" if locale == "en" else f"/{locale}/"
            node.children = fragment(f'<div class="nav-shell"><a class="brand" href="{home}"><img src="/assets/nonlate-icon.png" width="38" height="38" alt=""><span>Nonlate</span></a><nav class="guide-static-nav" aria-label="{ui["guides"]}"><a href="{home}">{ui["home"]}</a><a href="{route(locale)}">{ui["guides"]}</a></nav></div>')
        if node.tag == "details" and "data-language-switcher" in node.attrs:
            replacement = fragment(language_menu(guide, locale, "website-languages"))[0]
            node.children = replacement.children
    head = next(n for n in g.descendants(tree) if n.tag == "head")
    # The pillar shell preloads its store badges. Search guides render text
    # download links, so its badge resources are never used on these pages.
    head.children = [
        node for node in head.children if not (
            node.tag == "link"
            and node.attrs.get("rel") == "preload"
            and node.attrs.get("as") == "image"
            and node.attrs.get("href", "").startswith("/assets/store-badges/")
        )
    ]
    for target in [*guide["locales"], "x-default"]:
        head.children.append(g.Node("link", [("rel", "alternate"), ("hreflang", hreflang(target)), ("href", ORIGIN + route("en" if target == "x-default" else target, guide["slug"]))]))
    graph = [{"@type": "Article", "headline": t["title"], "description": t["description"], "mainEntityOfPage": canonical, "datePublished": guide["published"], "dateModified": updated, "inLanguage": locale, "author": {"@type": "Organization", "name": "Nonlate", "url": ORIGIN + "/"}, "publisher": {"@type": "Organization", "name": "Nonlate"}, "image": ORIGIN + "/og-launch-2026-10.png"}, {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": ui["home"], "item": ORIGIN + ("/" if locale == "en" else f"/{locale}/")}, {"@type": "ListItem", "position": 2, "name": ui["guides"], "item": ORIGIN + route(locale)}, {"@type": "ListItem", "position": 3, "name": t["title"], "item": canonical}]}]
    schema = g.Node("script", [("type", "application/ld+json")])
    schema.children = [g.Node(text=json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("<", "\\u003c"))]
    head.children.append(schema)
    output = ROOT / "out" / route(locale, guide["slug"]).strip("/") / "index.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(g.render(tree))


def localize_related_links(guides_by_slug):
    # English markup is rendered by Next so its interactive shell can hydrate.
    # The existing locale exports are script-free and reuse reviewed guide titles.
    for source, targets in RELATED_LINKS.items():
        locales = PLANNING_LOCALES if source == PLANNING else g.LOCALES
        for locale in locales:
            if locale == "en":
                continue
            page = f"/{locale}/support/" if source == "support" else route(locale, source)
            path = ROOT / "out" / page.strip("/") / "index.html"
            tree = g.Tree(path.read_text()).root
            nav = next(node for node in g.descendants(tree) if node.tag == "nav" and node.attrs.get("id") == "related")
            label = UI[locale]["related"]
            nav.attrs.update(lang=locale, **{"aria-label": label})
            links = "".join(
                f'<li><a href="{route(locale, slug)}" hreflang="{hreflang(locale)}">'
                f'{esc(guides_by_slug[slug]["locales"][locale]["title"])}</a></li>'
                for slug in targets
            )
            nav.children = fragment(f'<h2>{esc(label)}</h2><ul>{links}</ul>')
            path.write_text(g.render(tree))


def search_card(guide, locale):
    copy = guide["locales"][locale]
    updated = guide.get("updated", guide["published"])
    direction = "rtl" if locale in g.RTL else "ltr"
    slug = guide["slug"]
    html = (
        f'<article class="guide-card" lang="{locale}" dir="{direction}" data-search-guide="{slug}">'
        f'<h3><a href="{route(locale, slug)}" hreflang="{hreflang(locale)}">{esc(copy["title"])}</a></h3>'
        f'<p>{esc(copy["description"])}</p>'
        f'<p class="guide-byline">Nonlate · <time datetime="{updated}">{updated}</time></p></article>'
    )
    return fragment(html)[0]


def build_index(locale, guides):
    path = ROOT / "out" / route(locale).strip("/") / "index.html"
    tree = g.Tree(path.read_text()).root
    static_shell(tree, locale)
    main = next(node for node in g.descendants(tree) if node.tag == "main")
    title = next(node for node in g.descendants(tree) if node.tag == "title")
    heading = next(node for node in g.descendants(main) if node.tag == "h1")
    heading.children = [g.Node(text=g.text_content(title).removesuffix(" | Nonlate"))]
    cards = {guide["slug"]: search_card(guide, locale) for guide in guides}
    # Move the original cards after localization so their language labels and
    # links, including any explicit English fallback, stay intact.
    for group in list(main.children):
        if "guides-list" not in group.attrs.get("class", "").split():
            continue
        for card in (node for node in group.children if node.tag == "article"):
            card_heading = next(node for node in card.children if node.tag == "h2")
            link = next(node for node in g.descendants(card_heading) if node.tag == "a")
            slug = link.attrs["href"].rstrip("/").rsplit("/", 1)[-1]
            if slug in cards:
                raise ValueError(f"Duplicate guide card: {locale}/{slug}")
            card_heading.tag = "h3"
            cards[slug] = card
        main.children.remove(group)
    topics, labels = INDEX["topics"], INDEX["labels"][locale]
    listed = [slug for slugs in topics.values() for slug in slugs]
    if set(listed) != set(cards) or len(listed) != len(cards):
        raise ValueError(f"Guide topics must list every guide exactly once: {locale}")
    jumps = "".join(f'<li><a href="#{topic}">{esc(labels[topic])}</a></li>' for topic in topics)
    main.children.extend(fragment(f'<nav class="guide-topics" aria-label="{esc(UI[locale]["toc"])}"><ul>{jumps}</ul></nav>'))
    for topic, slugs in topics.items():
        section = fragment(f'<section id="{topic}" class="guide-topic"><h2>{esc(labels[topic])}</h2><div class="guides-list"></div></section>')[0]
        section.children[-1].children.extend(cards[slug] for slug in slugs)
        main.children.append(section)
    path.write_text(g.render(tree))


def main():
    guides = load_guides()
    guides_by_slug = {guide["slug"]: guide for guide in guides}
    if set(INDEX["labels"]) != set(g.LOCALES) or any(
        set(labels) != set(INDEX["topics"]) or any(not label.strip() for label in labels.values())
        for labels in INDEX["labels"].values()
    ):
        raise ValueError("Guide topics require labels in every supported locale")
    for guide in guides:
        for locale in guide["locales"]:
            build_article(guide, locale, guides_by_slug)
    localize_related_links(guides_by_slug)
    for locale in g.LOCALES:
        build_index(locale, guides)
    sitemap = ROOT / "out/sitemap.xml"
    xml = sitemap.read_text()
    for locale in g.LOCALES:
        index_loc = f"<loc>{ORIGIN}{route(locale)}</loc>"
        xml, count = re.subn(
            re.escape(index_loc) + r"(?:\s*<lastmod>[^<]*</lastmod>)?",
            index_loc + f'<lastmod>{INDEX["updated"]}</lastmod>',
            xml,
        )
        if count != 1:
            raise ValueError(f"Expected one sitemap entry for the guide index: {locale}")
    entries = ''.join(f'<url><loc>{ORIGIN}{route(locale, guide["slug"])}</loc><lastmod>{guide.get("updated", guide["published"])}</lastmod></url>\n' for guide in guides for locale in guide["locales"])
    sitemap.write_text(xml.replace('</urlset>', entries + '</urlset>'))
    print(f'Built {sum(len(guide["locales"]) for guide in guides)} reviewed search-intent guides; linked from all 47 indexes.')


if __name__ == "__main__":
    main()
