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
UI = {
    "en": {"answer": "The short answer", "toc": "In this guide", "faq": "Common questions", "related": "Related guides", "sources": "Further reading", "read": "Read the guide", "home": "Home", "guides": "Guides", "language": "Language", "disclosure": "Published by the maker of Nonlate. This guide explains our product, not an independent comparison.", "translation": "AI-assisted translation reviewed in this session; not native-speaker certification.", "app": "Download Nonlate on the App Store", "play": "Get Nonlate on Google Play", "plans": "Plans and source-trial details", "back": "All guides"},
    "es": {"answer": "Respuesta breve", "toc": "En esta guía", "faq": "Preguntas frecuentes", "related": "Guías relacionadas", "sources": "Más información", "read": "Leer la guía", "home": "Inicio", "guides": "Guías", "language": "Idioma", "disclosure": "Publicada por el creador de Nonlate. Esta guía explica nuestro producto; no es una comparación independiente.", "translation": "Traducción asistida por IA y revisada en esta sesión; no certificada por un hablante nativo.", "app": "Descargar Nonlate en App Store", "play": "Obtener Nonlate en Google Play", "plans": "Planes y detalles de la prueba de fuentes", "back": "Todas las guías"},
    "pt-BR": {"answer": "Resposta rápida", "toc": "Neste guia", "faq": "Perguntas frequentes", "related": "Guias relacionados", "sources": "Saiba mais", "read": "Ler o guia", "home": "Início", "guides": "Guias", "language": "Idioma", "disclosure": "Publicado pelo criador do Nonlate. Este guia explica nosso produto; não é uma comparação independente.", "translation": "Tradução assistida por IA e revisada nesta sessão; sem certificação de falante nativo.", "app": "Baixe o Nonlate na App Store", "play": "Instale o Nonlate pelo Google Play", "plans": "Planos e detalhes do teste de fontes", "back": "Todos os guias"},
    "fr": {"answer": "La réponse en bref", "toc": "Dans ce guide", "faq": "Questions fréquentes", "related": "Guides associés", "sources": "Pour aller plus loin", "read": "Lire le guide", "home": "Accueil", "guides": "Guides", "language": "Langue", "disclosure": "Publié par le créateur de Nonlate. Ce guide présente notre produit ; il ne s’agit pas d’un comparatif indépendant.", "translation": "Traduction assistée par IA et relue pendant cette session ; sans certification par un locuteur natif.", "app": "Télécharger Nonlate sur l’App Store", "play": "Obtenir Nonlate sur Google Play", "plans": "Offres et conditions de l’essai des sources", "back": "Tous les guides"},
    "de": {"answer": "Die kurze Antwort", "toc": "In diesem Leitfaden", "faq": "Häufige Fragen", "related": "Weitere Anleitungen", "sources": "Weiterführende Informationen", "read": "Anleitung lesen", "home": "Startseite", "guides": "Anleitungen", "language": "Sprache", "disclosure": "Vom Anbieter von Nonlate veröffentlicht. Diese Anleitung erklärt unser Produkt und ist kein unabhängiger Vergleich.", "translation": "KI-gestützte Übersetzung mit Prüfung in dieser Sitzung; keine muttersprachliche Zertifizierung.", "app": "Nonlate im App Store laden", "play": "Nonlate bei Google Play herunterladen", "plans": "Tarife und Testbedingungen für Quellen", "back": "Alle Anleitungen"},
}


def esc(value):
    return html.escape(value, quote=True)


def route(locale, slug=""):
    return f'/guides/{"" if locale == "en" else locale + "/"}{slug + "/" if slug else ""}'


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
    links = "".join(f'<a href="{route(code, guide["slug"])}" lang="{code}" hreflang="{code}"' + (' aria-current="page"' if code == locale else '') + f'>{esc(g.NATIVE[code])}</a>' for code in guide["locales"])
    return f'<details class="{css}"><summary>{UI[locale]["language"]} · {esc(g.NATIVE[locale])}</summary><nav aria-label="{UI[locale]["language"]}">{links}</nav></details>'


def load_guides():
    reviews = json.loads((DATA / "reviews.json").read_text())
    guides = []
    for path in sorted(DATA.glob("*.json")):
        if path.name == "reviews.json":
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        review = reviews["files"].get(path.name, {})
        if review.get("sha256") != digest or review.get("status") != "reviewed":
            raise ValueError(f"Unreviewed or changed search guide: {path.name}")
        guide = json.loads(path.read_text())
        if not re.fullmatch(r"[a-z]+(?:-[a-z]+)*", guide["slug"]):
            raise ValueError("Invalid guide slug")
        if set(guide["locales"]) != set(review["locales"]) or "en" not in guide["locales"]:
            raise ValueError("Reviewed locale set differs")
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
        guides.append(guide)
    if not guides or len({guide["slug"] for guide in guides}) != len(guides):
        raise ValueError("Missing or duplicate search guides")
    return guides


def article_markup(guide, locale, all_guides):
    t, ui = guide["locales"][locale], UI[locale]
    home = "/" if locale == "en" else f"/{locale}/"
    parts = [language_menu(guide, locale), f'<nav class="guide-breadcrumb" aria-label="{ui["guides"]}"><a href="{home}">{ui["home"]}</a><span aria-hidden="true">/</span><a href="{route(locale)}">{ui["guides"]}</a></nav>', '<article class="guide-article">', f'<header class="guides-heading"><p class="eyebrow">Nonlate · iPhone &amp; Android</p><h1>{esc(t["title"])}</h1><p>{esc(t["intro"])}</p><p class="guide-byline">Nonlate · <time datetime="{guide["published"]}">{guide["published"]}</time></p><p class="guide-disclosure">{esc(ui["disclosure"])}</p></header>', f'<section class="guide-answer" id="quick-answer"><h2>{ui["answer"]}</h2><p>{esc(t["answer"])}</p></section>', f'<nav class="guide-toc" aria-label="{ui["toc"]}"><h2>{ui["toc"]}</h2><ul>']
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
    related = [other for other in all_guides if other["slug"] != guide["slug"]]
    for other in related:
        target = locale if locale in other["locales"] else "en"
        parts.append(f'<li><a href="{route(target, other["slug"])}" hreflang="{target}">{esc(other["locales"][target]["title"])}</a></li>')
    # Link the already-established pillar guide in the current language.
    pillar = ROOT / "translations/guides" / f"{locale}.json"
    title = "How to block distracting apps until your tasks are done"
    if locale != "en":
        title = json.loads(pillar.read_text())["strings"][title]
    parts.append(f'<li><a href="{route(locale, "block-distracting-apps-until-tasks-are-done")}">{esc(title)}</a></li></ul></nav>')
    if guide.get("sources"):
        parts.append(f'<section id="sources" class="guide-notes"><h2>{ui["sources"]}</h2><ul>')
        # Source titles retain their original language, explicitly labelled.
        parts.extend(f'<li><a href="{esc(s["url"])}" lang="en" hreflang="en">{esc(s["label"])}</a></li>' for s in guide["sources"])
        parts.append('</ul></section>')
    parts.append('</article>')
    if locale != "en":
        parts.append(f'<p class="guide-translation-note">{ui["translation"]} <a href="{route("en", guide["slug"])}" hreflang="en" lang="en">English</a></p>')
    parts.append(f'<a class="guide-back" href="{route(locale)}">← {ui["back"]}</a>')
    return ''.join(parts)


def build_article(guide, locale, all_guides):
    t, ui = guide["locales"][locale], UI[locale]
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
            elif name in {"article:published_time", "article:modified_time"}:
                node.attrs["content"] = guide["published"]
        if node.tag == "link" and node.attrs.get("rel") == "canonical":
            node.attrs["href"] = canonical
        if node.tag == "main":
            node.children = fragment(article_markup(guide, locale, all_guides))
        if node.tag == "header" and node.attrs.get("class", "").startswith("site-header"):
            home = "/" if locale == "en" else f"/{locale}/"
            node.children = fragment(f'<div class="nav-shell"><a class="brand" href="{home}"><img src="/assets/nonlate-icon.png" width="38" height="38" alt=""><span>Nonlate</span></a><nav class="guide-static-nav" aria-label="{ui["guides"]}"><a href="{home}">{ui["home"]}</a><a href="{route(locale)}">{ui["guides"]}</a></nav></div>')
        if node.tag == "details" and "data-language-switcher" in node.attrs:
            replacement = fragment(language_menu(guide, locale, "website-languages"))[0]
            node.children = replacement.children
    head = next(n for n in g.descendants(tree) if n.tag == "head")
    for target in [*guide["locales"], "x-default"]:
        head.children.append(g.Node("link", [("rel", "alternate"), ("hreflang", target), ("href", ORIGIN + route("en" if target == "x-default" else target, guide["slug"]))]))
    graph = [{"@type": "Article", "headline": t["title"], "description": t["description"], "mainEntityOfPage": canonical, "datePublished": guide["published"], "dateModified": guide["published"], "inLanguage": locale, "author": {"@type": "Organization", "name": "Nonlate", "url": ORIGIN + "/"}, "publisher": {"@type": "Organization", "name": "Nonlate"}, "image": ORIGIN + "/og-launch-2026-10.png"}, {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": ui["home"], "item": ORIGIN + ("/" if locale == "en" else f"/{locale}/")}, {"@type": "ListItem", "position": 2, "name": ui["guides"], "item": ORIGIN + route(locale)}, {"@type": "ListItem", "position": 3, "name": t["title"], "item": canonical}]}]
    schema = g.Node("script", [("type", "application/ld+json")])
    schema.children = [g.Node(text=json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace("<", "\\u003c"))]
    head.children.append(schema)
    output = ROOT / "out" / route(locale, guide["slug"]).strip("/") / "index.html"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(g.render(tree))


def main():
    guides = load_guides()
    for guide in guides:
        for locale in guide["locales"]:
            build_article(guide, locale, guides)
    # Add cards after legacy localization so its frozen source stays stable.
    for locale in g.LOCALES:
        index = ROOT / "out" / route(locale).strip("/") / "index.html"
        tree = g.Tree(index.read_text()).root
        static_shell(tree, locale)
        main_node = next(n for n in g.descendants(tree) if n.tag == "main")
        cards = []
        for guide in guides:
            target = locale if locale in guide["locales"] else "en"
            t, ui = guide["locales"][target], UI[target]
            label = ui["read"] if target == locale else "Read in English"
            cards.append(f'<article class="guide-card" lang="{target}" dir="ltr" data-search-guide="{guide["slug"]}"><h2><a href="{route(target, guide["slug"])}" hreflang="{target}">{esc(t["title"])}</a></h2><p>{esc(t["description"])}</p><p class="guide-byline">Nonlate · <time datetime="{guide["published"]}">{guide["published"]}</time></p><a class="guide-read-link" href="{route(target, guide["slug"])}" hreflang="{target}">{label} ↗</a></article>')
        main_node.children.extend(fragment('<div class="guides-list search-guides">' + ''.join(cards) + '</div>'))
        index.write_text(g.render(tree))
    sitemap = ROOT / "out/sitemap.xml"
    xml = sitemap.read_text()
    entries = ''.join(f'<url><loc>{ORIGIN}{route(locale, guide["slug"])}</loc><lastmod>{guide["published"]}</lastmod></url>\n' for guide in guides for locale in guide["locales"])
    sitemap.write_text(xml.replace('</urlset>', entries + '</urlset>'))
    print(f'Built {sum(len(guide["locales"]) for guide in guides)} reviewed search-intent guides; linked from all 47 indexes.')


if __name__ == "__main__":
    main()
