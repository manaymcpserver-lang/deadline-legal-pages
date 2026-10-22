#!/usr/bin/env python3
"""Generate self-contained localized guide pages from checked-in dictionaries.

English stays in the Next.js source. Localized pages are built from that exact
export with checked-in dictionaries: no runtime translation requests, cookies,
tracking, redirects, or extra client bundles. The build never calls a translator.
"""
import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
DATA = ROOT / "translations" / "guides"
LOCALES = json.loads((ROOT / "app/guides/locales.json").read_text())
ARTICLE = "/guides/block-distracting-apps-until-tasks-are-done/"
PAGES = ["/guides/", ARTICLE]
ORIGIN = "https://nonlate.app"
NOTE = "This translation is machine-assisted. For unclear wording, read the English version or contact Nonlate support."
MANUAL_GUIDE_SOURCE_HASH = "75b5e4312258640ed2d190791b5357d46c4315596a4fff070800491812cc16f2"
RTL = {"ar", "fa", "he", "ur"}
PROTECTED = re.compile(r"\b(?:Nonlate|iPhone|iOS|Android|App Store|Google Play|Focus Lock|Plus|Pro|Screen Time)\b|support@nonlate\.app")
NATIVE = json.loads((ROOT / "app/guides/language-names.json").read_text())
ARTWORK = json.loads((ROOT / "app/guides/artwork.json").read_text())["assets"]
MEDIA_LABELS = json.loads((ROOT / "translations/media-labels.json").read_text())
PLAY_MEDIA_LABELS = json.loads((ROOT / "translations/play-media-labels.json").read_text())
HOMEPAGE_ARTWORK = json.loads((ROOT / "app/homepage-artwork.json").read_text())["assets"]
VOID = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}


class Node:
    def __init__(self, tag=None, attrs=None, text=None):
        self.tag, self.attrs, self.text, self.children = tag, dict(attrs or []), text, []


class Tree(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.root = Node("document")
        self.stack = [self.root]
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if self.stack[-1].tag != tag:
            raise ValueError(f"Unbalanced source HTML: {tag} after {self.stack[-1].tag}")
        self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].children.append(Node(text=data))


def render(node):
    if node.tag is None:
        return html.escape(node.text, quote=False)
    inner = "".join(render(child) for child in node.children)
    if node.tag == "document":
        return "<!DOCTYPE html>" + inner
    attrs = "".join(f' {key}="{html.escape(value or "", quote=True)}"' for key, value in node.attrs.items())
    if node.tag in VOID:
        return f"<{node.tag}{attrs}>"
    if node.tag == "script":
        inner = "".join(child.text or "" for child in node.children)
    return f"<{node.tag}{attrs}>{inner}</{node.tag}>"


def path_for(code, original):
    return original if code == "en" else f"/guides/{code}/" + original.removeprefix("/guides/")


def useful(value):
    return bool(value.strip()) and bool(re.search(r"[A-Za-z]", value)) and value.strip() not in {"Nonlate", "support@nonlate.app", "nonlate.app", "iPhone", "Android", "iOS", "→", "↗", "←"}


def descendants(node):
    for child in node.children:
        yield child
        yield from descendants(child)


def text_content(node):
    return node.text or "" if node.tag is None else "".join(text_content(child) for child in node.children)


def paragraph_unit(node):
    # Keep complete sentences together, including inline link/strong text.
    # This avoids translating fragments such as "Use" as a noun.
    return node.tag in {"p","figcaption","li"} and not any(child.tag in {"p","h2","h3","ul","ol","time"} for child in descendants(node))


def source_strings():
    strings = {NOTE, "English version", "Language", "Available languages", "Home", "Guides"}
    for path in PAGES:
        tree = Tree((OUT / path.strip("/") / "index.html").read_text()).root

        def visit(node, skip=False, grouped=False):
            skip = skip or node.tag in {"script","style"} or bool(node.attrs.get("lang")) or "data-language-switcher" in node.attrs
            if skip:
                return
            if not grouped and paragraph_unit(node) and useful(text_content(node)):
                strings.add(text_content(node).strip())
                for link in descendants(node):
                    if link.tag == "a" and useful(text_content(link)):
                        strings.add(text_content(link).strip())
                grouped = True
            if node.tag is None and not grouped and useful(node.text):
                strings.add(node.text.strip())
            for key, value in node.attrs.items():
                if key in {"alt","aria-label","title"} and value and useful(value):
                    strings.add(value.strip())
                if node.tag == "meta" and key == "content" and node.attrs.get("name", node.attrs.get("property", "")) in {"description","og:title","og:description","og:image:alt","twitter:title","twitter:description"}:
                    strings.add(value.strip())
            for child in node.children:
                visit(child, skip, grouped)
        # html[lang=en] describes the page, not a proper-name language link.
        for node in tree.children:
            if node.tag == "html":
                node.attrs.pop("lang", None)
        visit(tree)
    return sorted(strings)


def source_hash(strings):
    return hashlib.sha256(json.dumps(strings, ensure_ascii=False).encode()).hexdigest()


def localize(path, code, strings):
    values = json.loads((DATA / f"{code}.json").read_text())
    allow_draft = os.environ.get("NONLATE_TRANSLATION_DRAFT") == "1" or bool(os.environ.get("NONLATE_PREVIEW_LOCALES"))
    if values.get("reviewStatus") != "approved" and not allow_draft:
        raise ValueError(f"Guide translation {code} is an unapproved draft. Production export is blocked; use NONLATE_TRANSLATION_DRAFT=1 for local QA only.")
    if values["sourceHash"] != source_hash(strings) or set(values["strings"]) != set(strings):
        raise ValueError(f"Stale or incomplete translation: {code}")
    translated = values["strings"]
    def tr(value):
        stripped = value.strip()
        if stripped in translated:
            return value[:len(value)-len(value.lstrip())] + translated[stripped] + value[len(value.rstrip()):]
        return value
    root = Tree((OUT / path.strip("/") / "index.html").read_text()).root
    def walk(node, proper=False):
        if node.tag == "script":
            if node.attrs.get("type") != "application/ld+json":
                return False
            data = json.loads("".join(c.text or "" for c in node.children))
            def schema(value):
                if isinstance(value, list): return [schema(v) for v in value]
                if isinstance(value, dict): return {k:code if k == "inLanguage" else schema(v) for k,v in value.items()}
                if isinstance(value, str):
                    if value == ORIGIN + "/":
                        return ORIGIN + f"/{code}/"
                    for original in sorted(PAGES, key=len, reverse=True):
                        if value.startswith(ORIGIN+original):
                            return value.replace(ORIGIN+original, ORIGIN+path_for(code,original), 1)
                    return tr(value)
                return value
            node.children = [Node(text=json.dumps(schema(data), ensure_ascii=False).replace("<", "\\u003c"))]
            return True
        if node.tag == "link" and (node.attrs.get("as") == "script" or node.attrs.get("rel") == "modulepreload"):
            return False
        is_native_link = node.tag == "a" and "lang" in node.attrs
        # Explicitly language-tagged editorial cards remain in their original
        # language until reviewed article translations exist. Do not relabel
        # English posts as translations or rewrite their canonical links.
        proper = proper or is_native_link or (node.tag != "html" and bool(node.attrs.get("lang")))
        if node.tag == "html":
            node.attrs.update(lang=code, dir="rtl" if code in RTL else "ltr")
        if node.tag is None:
            if not proper: node.text = tr(node.text)
            return True
        for key, value in list(node.attrs.items()):
            if value is None: continue
            if key in {"alt","aria-label","title"} and not proper:
                node.attrs[key] = tr(value)
            if node.tag == "meta" and key == "content":
                kind = node.attrs.get("name",node.attrs.get("property", ""))
                if kind in {"description","og:title","og:description","og:image:alt","twitter:title","twitter:description"}:
                    node.attrs[key] = tr(value)
                elif kind == "robots" and values.get("reviewStatus") != "approved":
                    node.attrs[key] = "noindex, nofollow"
                elif kind == "og:url":
                    node.attrs[key] = ORIGIN + path_for(code,path)
            if key == "href" and not proper:
                if value in PAGES: node.attrs[key] = path_for(code,value)
                elif value in {'/privacy/','/terms/','/support/','/data-deletion/'}: node.attrs[key] = f'/{code}{value}'
                elif value == "/" or value.startswith("/#"): node.attrs[key] = f"/{code}/" + value[1:]
                if node.attrs.get("rel") == "canonical": node.attrs[key] = ORIGIN + path_for(code,path)
        if is_native_link:
            node.attrs.pop("aria-current",None)
            if node.attrs["lang"] == code: node.attrs["aria-current"] = "page"
        if node.tag == "summary" and any("Language · English" in (c.text or "") for c in node.children):
            node.children = [Node(text=translated["Language"]+" · "+NATIVE[code])]
        if paragraph_unit(node) and useful(text_content(node)) and not proper:
            # Rebuild the complete translated sentence, retaining every link.
            # If grammar changes a link label, retain it as a separate link
            # rather than forcing an ungrammatical word-by-word translation.
            sentence = tr(text_content(node).strip())
            links = [child for child in descendants(node) if child.tag == "a"]
            rebuilt = [Node(text=sentence)]
            for link in links:
                label = tr(text_content(link).strip())
                destination = link.attrs.get("href", "")
                if destination in PAGES:
                    destination = path_for(code, destination)
                elif destination in {'/privacy/','/terms/','/support/','/data-deletion/'}:
                    destination = f'/{code}{destination}'
                elif destination == "/" or destination.startswith("/#"):
                    destination = f"/{code}/" + destination[1:]
                link.attrs["href"] = destination
                link.children = [Node(text=label)]
                inserted = False
                for index, piece in enumerate(rebuilt):
                    if piece.tag is None and label in piece.text:
                        before, after = piece.text.split(label,1)
                        rebuilt[index:index+1] = [Node(text=before),link,Node(text=after)]
                        inserted = True
                        break
                if not inserted:
                    rebuilt.extend([Node(text=" ("),link,Node(text=")")])
            node.children = rebuilt
        else:
            node.children = [child for child in node.children if walk(child,proper)]
        if node.tag == "header" and node.attrs.get("class", "") .startswith("site-header"):
            node.children = Tree(f'<div class="nav-shell"><a class="brand" href="/{code}/" aria-label="{html.escape(tr("Home"),quote=True)}"><img src="/assets/nonlate-icon.png" width="38" height="38" alt=""><span>Nonlate</span></a><nav class="guide-static-nav" aria-label="{html.escape(tr("Guides"),quote=True)}"><a href="/{code}/">{html.escape(tr("Home"))}</a><a href="{path_for(code,"/guides/")}">{html.escape(tr("Guides"))}</a></nav></div>').root.children
        if node.tag == "main":
            node.children.append(Tree(f'<p class="guide-translation-note">{html.escape(translated[NOTE])} <a href="{path}" hreflang="en">{html.escape(translated["English version"])}</a></p>').root.children[0])
        return True
    walk(root)
    # The shared footer was rendered in English. Keep its selector on the
    # current guide instead of sending readers back to a homepage.
    for node in descendants(root):
        if node.tag == "details" and "data-language-switcher" in node.attrs:
            summary = next((child for child in node.children if child.tag == "summary"), None)
            if summary is not None:
                summary.children = [Node(text=translated["Language"] + " · " + NATIVE[code])]
            for link in descendants(node):
                target = link.attrs.get("lang") if link.tag == "a" else None
                if target in LOCALES:
                    link.attrs["href"] = path_for(target, path)
                    link.attrs.pop("aria-current", None)
                    if target == code:
                        link.attrs["aria-current"] = "page"
    # Store artwork is a localized illustration, never a claimed live capture.
    # Raw screenshots without a matching equivalent retain an explicit English
    # label. The English guide original is untouched.
    for node in descendants(root):
        if node.tag != "figure":
            continue
        picture = next((child for child in descendants(node) if child.tag == "img"), None)
        if picture is None or picture.attrs.get("src") not in {"/assets/screens/ios-blocker.png", "/assets/screens/android-blocker.png"}:
            continue
        is_ios = picture.attrs["src"] == "/assets/screens/ios-blocker.png"
        asset = ARTWORK.get(code) if is_ios else HOMEPAGE_ARTWORK.get(code, {}).get("/assets/screens/android-blocker.png")
        if asset and asset.get('kind')=='website-illustration':
            label='Nonlate · '+('iOS' if is_ios else 'Android')
        else:
            label = (MEDIA_LABELS[code] if is_ios else PLAY_MEDIA_LABELS[code]) if asset else translated["English version"]
        if asset:
            picture.attrs.update(src=asset["src"], alt=f"Nonlate · {label} · {NATIVE[code]}", width=str(asset.get("width",660)), height=str(asset.get("height",1434)))
            node.attrs["data-artwork-kind"] = asset.get('kind','store-illustration')
        else:
            picture.attrs["lang"] = "en"
            node.attrs["data-artwork-kind"] = "english-screenshot"
        marker = Node("div", [("class", "guide-media-language"), ("lang", code)])
        marker.children = [Node(text=label)]
        node.children.insert(1, marker)
    result = render(root)
    destination = OUT / path_for(code,path).strip("/") / "index.html"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(result)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["extract","compose","build"])
    args = parser.parse_args()
    strings = source_strings()
    if args.command == "extract":
        DATA.mkdir(parents=True, exist_ok=True)
        (DATA / "source.json").write_text(json.dumps({"sourceHash":source_hash(strings),"strings":strings},ensure_ascii=False,indent=2)+"\n")
        print(f"{len(strings)} translation units, {sum(map(len,strings))} source characters")
    elif args.command == "compose":
        # Reconcile already translated inline fragments into complete stored
        # paragraphs without making any network requests. Curated overrides
        # are applied below; incomplete paragraphs remain a hard build error.
        for code in LOCALES:
            if code == "en": continue
            destination = DATA / f"{code}.json"
            previous_document = json.loads(destination.read_text()) if destination.exists() else {}
            previous = previous_document.get("strings", {})
            # Older partial overrides must not silently replace a later complete
            # source-by-source review when nothing in the English source changed.
            if (previous_document.get("sourceHash") == source_hash(strings)
                    and set(previous) == set(strings)
                    and previous_document.get("reviewStatus") in {"in-session-reviewed", "approved"}):
                print(f"{code}: preserving complete reviewed guide")
                continue
            keys = sorted(previous, key=len, reverse=True)
            result = {}
            for source in strings:
                if source in previous:
                    result[source] = previous[source]
                    continue
                rest, pieces = source, []
                while rest:
                    match = next((key for key in keys if rest.startswith(key)), None)
                    if match:
                        pieces.append(previous[match]); rest = rest[len(match):]
                    elif rest[0].isspace() or not rest[0].isalnum():
                        pieces.append(rest[0]); rest = rest[1:]
                    else:
                        term = PROTECTED.match(rest)
                        if not term: break
                        pieces.append(term.group()); rest = rest[term.end():]
                if not rest: result[source] = "".join(pieces)
            overrides_path = DATA / "overrides.json"
            if overrides_path.exists():
                result.update(json.loads(overrides_path.read_text()).get(code, {}))
            manual_path = DATA / "manual" / f"{code}.json"
            if manual_path.exists():
                # Manual numeric indices refer to the checked-in source, never
                # a freshly sorted export. New chrome copy must not silently
                # shift every translation to the wrong English sentence.
                baseline_document = json.loads((DATA / "source.json").read_text())
                if baseline_document.get("sourceHash") != MANUAL_GUIDE_SOURCE_HASH:
                    raise ValueError(f"{code}: indexed guide overrides need reconciliation with the changed source")
                baseline = baseline_document["strings"]
                for index, text in json.loads(manual_path.read_text()).items():
                    original = baseline[int(index)]
                    if original in strings: result[original] = text
            for title in ["Guides to tasks, deadlines and fewer distractions", "How to block distracting apps until your tasks are done"]:
                if title in result: result[title + " | Nonlate"] = result[title] + " | Nonlate"
            destination.write_text(json.dumps({"locale":code,"sourceHash":source_hash(strings),"revision":2,"reviewStatus":"draft","method":"machine-assisted translation with in-session corrections; not native-speaker certification","strings":{s:result[s] for s in strings if s in result}},ensure_ascii=False,indent=2)+"\n")
            print(f"{code}: {len(result)}/{len(strings)} units")
    else:
        for code in LOCALES:
            if code != "en":
                for path in PAGES: localize(path,code,strings)
        sitemap = (ROOT / "public/sitemap.xml").read_text()
        entries = "".join(f"  <url><loc>{ORIGIN}{path_for(code,path)}</loc></url>\n" for code in LOCALES if code != "en" for path in PAGES)
        (OUT / "sitemap.xml").write_text(sitemap.replace("</urlset>", entries+"</urlset>"))
        print(f"Built {2*(len(LOCALES)-1)} localized static guide pages")


if __name__ == "__main__": main()
