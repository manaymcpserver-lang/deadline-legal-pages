import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { searchGuides, searchGuidePath, searchGuideRoutes } from "../scripts/search-guide-registry.mjs";

const root = new URL("../", import.meta.url);
const read = path => readFile(new URL(path, root), "utf8");
const visible = html => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
const escaped = text => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

test("search guides publish reviewed, complete translations with matching visible content and metadata", async () => {
  assert.equal(searchGuides.length, 4);
  assert.equal(searchGuideRoutes.length, 20);
  const reviews = JSON.parse(await read("app/guides/search-content/reviews.json"));
  for (const [file, review] of Object.entries(reviews.files)) {
    assert.equal(review.status, "reviewed");
    assert.equal(createHash("sha256").update(await read(`app/guides/search-content/${file}`)).digest("hex"), review.sha256);
  }
  const titles = new Set();
  for (const guide of searchGuides) {
    for (const [locale, copy] of Object.entries(guide.locales)) {
      const route = searchGuidePath(locale, guide.slug);
      const html = await read(`out${route}index.html`);
      const body = visible(html);
      assert.equal((body.match(/<h1\b/g) || []).length, 1, route);
      assert.ok(body.includes(`<h1>${escaped(copy.title)}</h1>`), route);
      assert.ok(body.includes(escaped(copy.answer)), route);
      assert.ok(html.includes(`<html lang="${locale}" dir="ltr"`), route);
      assert.ok(html.includes(`rel="canonical" href="https://nonlate.app${route}"`), route);
      assert.ok(html.includes(`content="${escaped(copy.description).replaceAll('"', '&quot;')}"`), route);
      assert.ok(!titles.has(copy.title), `Duplicate title ${copy.title}`);
      titles.add(copy.title);
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
        assert.ok(alternates.some(([, lang, url]) => lang === code && url === `https://nonlate.app${searchGuidePath(code, guide.slug)}`), route);
        assert.ok(html.includes(`href="${searchGuidePath(code, guide.slug)}" lang="${code}" hreflang="${code}"`));
      }
      assert.ok(alternates.some(([, lang, url]) => lang === "x-default" && url === `https://nonlate.app${searchGuidePath('en', guide.slug)}`));
      assert.doesNotMatch(html, new RegExp(`/guides/ja/${guide.slug}/`));
      assert.equal(sitemap.split(`<loc>https://nonlate.app${route}</loc>`).length - 1, 1);
      const related = visible(html).match(/<nav id="related"[\s\S]*?<\/nav>/)[0];
      for (const other of searchGuides.filter(other => other.slug !== guide.slug)) assert.ok(related.includes(searchGuidePath(locale, other.slug)));
    }
  }
});

test("all 47 indexes expose new guides in their actual language and retain old translations", async () => {
  const locales = JSON.parse(await read("app/guides/locales.json"));
  for (const locale of locales) {
    const html = await read(`out/guides/${locale === "en" ? "" : `${locale}/`}index.html`);
    for (const guide of searchGuides) {
      const target = guide.locales[locale] ? locale : "en";
      const card = html.match(new RegExp(`<article[^>]*data-search-guide="${guide.slug}"[\\s\\S]*?<\\/article>`))[0];
      assert.ok(card.includes(`lang="${target}" dir="ltr"`), locale);
      assert.ok(card.includes(searchGuidePath(target, guide.slug)), locale);
      assert.ok(card.includes(escaped(guide.locales[target].title)), locale);
      if (locale !== target) assert.ok(card.includes("Read in English"), locale);
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
