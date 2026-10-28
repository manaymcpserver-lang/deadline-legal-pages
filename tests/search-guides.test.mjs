import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { searchGuides, searchGuidePath, searchGuideRoutes } from "../scripts/search-guide-registry.mjs";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const visible = html => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
const escaped = text => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const escapedAttr = text => escaped(text).replaceAll('"', '&quot;').replaceAll("'", '&#x27;');
const locales = JSON.parse(await read("app/guides/locales.json"));
const direction = code => ["ar", "fa", "he", "ur"].includes(code) ? "rtl" : "ltr";
const hreflang = code => code === "fil" ? "tl" : code;

test("publication validates full translations and safe slugs including year segments", () => {
  const script = `
import copy, hashlib, importlib.util, json, tempfile
from pathlib import Path
root = Path.cwd()
spec = importlib.util.spec_from_file_location('search_guides', root / 'scripts/build-search-guides.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
original = json.loads((builder.DATA / 'study.json').read_text())
for case in ('missing', 'english-clone', 'english-answer', 'numeric-slug', 'unsafe-slug'):
    guide = copy.deepcopy(original)
    if case == 'missing':
        del guide['locales']['ja']
    elif case == 'english-clone':
        guide['locales']['hi'] = json.loads(json.dumps(guide['locales']['en'], sort_keys=True))
    elif case == 'english-answer':
        guide['locales']['hi']['answer'] = guide['locales']['en']['answer']
    else:
        guide['slug'] = 'choosing-an-app-blocker-for-2027' if case == 'numeric-slug' else '../2027'
    with tempfile.TemporaryDirectory() as directory:
        builder.DATA = Path(directory)
        path = builder.DATA / 'study.json'
        path.write_text(json.dumps(guide, ensure_ascii=False))
        review = {'uiSha256': hashlib.sha256((root / 'app/guides/search-ui.json').read_bytes()).hexdigest(), 'files': {'study.json': {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'status': 'reviewed', 'locales': list(guide['locales'])}}}
        (builder.DATA / 'reviews.json').write_text(json.dumps(review))
        try:
            builder.load_guides()
        except ValueError as error:
            expected = 'Every guide must cover' if case == 'missing' else 'Invalid guide slug' if case == 'unsafe-slug' else 'Untranslated article copy'
            assert expected in str(error), str(error)
        else:
            assert case == 'numeric-slug', 'Publication allowed ' + case
`;
  const result = spawnSync("python3", ["-c", script], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("search guides publish reviewed, complete translations with matching visible content and metadata", async () => {
  assert.ok(searchGuides.length >= 4);
  assert.equal(searchGuideRoutes.length, searchGuides.length * locales.length);
  const reviews = JSON.parse(await read("app/guides/search-content/reviews.json"));
  const uiSource = await read("app/guides/search-ui.json");
  assert.equal(createHash("sha256").update(uiSource).digest("hex"), reviews.uiSha256);
  const ui = JSON.parse(uiSource);
  assert.deepEqual(Object.keys(ui).sort(), [...locales].sort());
  for (const copy of Object.values(ui)) {
    assert.deepEqual(Object.keys(copy).sort(), Object.keys(ui.en).sort());
    assert.ok(Object.values(copy).every(value => typeof value === "string" && value.trim()));
  }
  for (const [file, review] of Object.entries(reviews.files)) {
    assert.equal(review.status, "reviewed");
    assert.equal(createHash("sha256").update(await read(`app/guides/search-content/${file}`)).digest("hex"), review.sha256);
  }
  for (const guide of searchGuides) {
    assert.deepEqual(Object.keys(guide.locales).sort(), [...locales].sort());
    for (const [locale, copy] of Object.entries(guide.locales)) {
      const route = searchGuidePath(locale, guide.slug);
      const html = await read(`out${route}index.html`);
      const body = visible(html).replaceAll("&#x27;", "'").replaceAll("&quot;", '"');
      assert.equal((body.match(/<h1\b/g) || []).length, 1, route);
      assert.ok(body.includes(`<h1>${escaped(copy.title)}</h1>`), route);
      assert.ok(body.includes(escaped(copy.answer)), route);
      for (const key of ["answer", "toc", "faq", "related", "sources", "disclosure", "app", "play", "plans", "back"]) {
        assert.ok(body.includes(escaped(ui[locale][key])), `${route}: missing translated interface ${key}`);
      }
      if (locale !== "en") assert.ok(body.includes(escaped(ui[locale].translation)), `${route}: translation note`);
      assert.ok(html.includes(`<html lang="${locale}" dir="${direction(locale)}"`), route);
      assert.ok(html.includes(`rel="canonical" href="https://nonlate.app${route}"`), route);
      assert.ok(html.includes(`content="${escapedAttr(copy.description)}"`), route);
      assert.doesNotMatch(html, /<script(?![^>]*application\/ld\+json|[^>]*language-suggestion\.js)/i, route);
      assert.doesNotMatch(body, /<button\b/, `${route}: inert control`);
      const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
      assert.equal(schema["@graph"].length, 2);
      const article = schema["@graph"].find(node => node["@type"] === "Article");
      assert.equal(article.headline, copy.title);
      assert.equal(article.mainEntityOfPage, `https://nonlate.app${route}`);
      assert.equal(article.datePublished, guide.published);
      assert.equal(article.inLanguage, locale);
      const crumbs = schema["@graph"].find(node => node["@type"] === "BreadcrumbList");
      assert.equal(crumbs.itemListElement[1].item, `https://nonlate.app/guides/${locale === 'en' ? '' : `${locale}/`}`);
      for (const section of copy.sections) {
        assert.ok(body.includes(`id="${section.id}"`), route);
        for (const paragraph of [...section.paragraphs, ...(section.steps || [])]) assert.ok(body.includes(escaped(paragraph)), `${route}: missing content`);
      }
      for (const faq of copy.faq) {
        assert.ok(body.includes(escaped(faq.question)), route);
        assert.ok(body.includes(escaped(faq.answer)), route);
      }
      assert.ok(body.includes('href="https://apps.apple.com/app/id6759996284"'));
      assert.ok(body.includes('href="https://play.google.com/store/apps/details?id=com.nonlate.app"'));
    }
  }
});

test("search-guide alternates, menus and sitemap reference only available same-page translations", async () => {
  const sitemap = await read("out/sitemap.xml");
  for (const guide of searchGuides) {
    for (const locale of Object.keys(guide.locales)) {
      const route = searchGuidePath(locale, guide.slug);
      const html = await read(`out${route}index.html`);
      const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
      assert.equal(alternates.length, Object.keys(guide.locales).length + 1, route);
      for (const code of Object.keys(guide.locales)) {
        assert.ok(alternates.some(([, lang, url]) => lang === hreflang(code) && url === `https://nonlate.app${searchGuidePath(code, guide.slug)}`), route);
        assert.ok(html.includes(`href="${searchGuidePath(code, guide.slug)}" lang="${code}" hreflang="${hreflang(code)}"`));
      }
      assert.ok(alternates.some(([, lang, url]) => lang === "x-default" && url === `https://nonlate.app${searchGuidePath('en', guide.slug)}`));
      assert.ok(html.includes(searchGuidePath("ja", guide.slug)));
      assert.equal(sitemap.split(`<loc>https://nonlate.app${route}</loc>`).length - 1, 1);
      const related = visible(html).match(/<nav id="related"[\s\S]*?<\/nav>/)[0];
      for (const other of searchGuides.filter(other => other.slug !== guide.slug)) assert.ok(related.includes(searchGuidePath(locale, other.slug)));
    }
  }
});

test("all 47 indexes expose new guides in their actual language and retain old translations", async () => {
  for (const locale of locales) {
    const html = await read(`out/guides/${locale === "en" ? "" : `${locale}/`}index.html`);
    for (const guide of searchGuides) {
      const target = locale;
      const card = html.match(new RegExp(`<article[^>]*data-search-guide="${guide.slug}"[\\s\\S]*?<\\/article>`))[0];
      assert.ok(card.includes(`lang="${target}" dir="${direction(target)}"`), locale);
      assert.ok(card.includes(searchGuidePath(target, guide.slug)), locale);
      assert.ok(card.includes(escaped(guide.locales[target].title)), locale);
      assert.ok(!card.includes("Read in English"), locale);
    }
    assert.ok(html.includes("block-distracting-apps-until-tasks-are-done/"));
    assert.doesNotMatch(html, /<script(?![^>]*language-suggestion\.js)/i, locale);
  }
  // The guide index gains cards after Next exports its RSC payload. Legacy
  // client-side links must request the final HTML rather than the older payload.
  for (const slug of ["block-distracting-apps-until-tasks-are-done", "a-deadline-is-not-a-plan", "best-productivity-app"]) {
    const source = await read(`app/guides/${slug}/page.tsx`);
    assert.doesNotMatch(source, /<Link[^>]*href="\/guides\/"/);
    assert.match(source, /<a[^>]*href="\/guides\/"/);
  }
});
