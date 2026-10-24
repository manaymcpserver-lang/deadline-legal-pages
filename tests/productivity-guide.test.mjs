import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const locales = JSON.parse(await read("app/guides/locales.json"));
const copy = JSON.parse(await read("translations/productivity-guide/copy.json"));
const route = (locale) => `/guides/${locale === "en" ? "" : `${locale}/`}best-productivity-app/`;
const strip = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

test("productivity guide publishes all 47 complete, matching-language articles", async () => {
  assert.deepEqual(Object.keys(copy).sort(), [...locales].sort());
  const source = JSON.parse(await read("translations/productivity-guide/source.json"));
  const sitemap = await read("out/sitemap.xml");
  for (const locale of locales) {
    const html = await read(`out${route(locale)}index.html`);
    const visible = strip(html);
    const text = locale === "en" ? copy.en : Object.fromEntries(Object.keys(copy.en).map((key, i) => [key, copy[locale][i]]));
    assert.equal((visible.match(/<h1\b/g) ?? []).length, 1);
    assert.ok(visible.includes(text.title));
    for (const value of Object.values(text)) assert.ok(visible.includes(value), `${locale}: missing article copy`);
    assert.ok(html.includes(`rel="canonical" href="https://nonlate.app${route(locale)}"`));
    assert.match(html, /property="og:type" content="article"/);
    assert.ok(sitemap.includes(`https://nonlate.app${route(locale)}`));
    for (const other of locales) {
      assert.ok(visible.includes(`href="${route(other)}"`), `${locale} -> ${other}`);
      assert.ok(html.includes(`href="https://nonlate.app${route(other)}"`));
    }
    assert.match(visible, /https:\/\/apps.apple.com\/app\/id6759996284/);
    assert.match(visible, /https:\/\/play.google.com\/store\/apps\/details\?id=com.nonlate.app/);
    const schema = JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
    const article = schema['@graph'].find(item => item['@type'] === 'Article');
    assert.equal(article.headline, text.title);
    assert.equal(article.description, text.intro);
    assert.equal(article.inLanguage, locale);
    assert.equal(article.datePublished, "2026-10-24");
    assert.equal(article.mainEntityOfPage, `https://nonlate.app${route(locale)}`);
    const index = strip(await read(`out/guides/${locale === 'en' ? '' : `${locale}/`}index.html`));
    const card = index.match(/<article[^>]*data-guide="productivity"[\s\S]*?<\/article>/)?.[0];
    assert.ok(card?.includes(`href="${route(locale)}"`));
    assert.ok(card.includes(text.title));
    assert.ok(card.includes(`lang="${locale}"`));
    if (locale !== "en") {
      assert.ok(html.includes(`<html lang="${locale}" dir="${['ar','fa','he','ur'].includes(locale) ? 'rtl' : 'ltr'}"`));
      assert.doesNotMatch(html, /<script(?![^>]*application\/ld\+json)/i);
      assert.ok(!visible.includes(copy.en.intro));
      const dictionary = JSON.parse(await read(`translations/productivity-guide/${locale}.json`));
      assert.equal(dictionary.sourceHash, source.sourceHash);
      assert.deepEqual(Object.keys(dictionary.strings).sort(), [...source.strings].sort());
      assert.equal(dictionary.reviewStatus, "approved");
      for (const [key, value] of Object.entries(dictionary.strings)) {
        assert.ok(value.trim());
        if (key.includes("Nonlate")) assert.ok(value.includes("Nonlate"));
        if (key.includes("20+")) assert.match(value, /20/);
      }
    }
  }
});

test("productivity guide retains limitations rather than promising a best-app ranking", async () => {
  const html = strip(await read(`out${route('en')}index.html`));
  for (const phrase of ['Calendar events do not trigger blocking', 'does not verify', 'other due tasks may keep blocking active', 'Timed breaks are available', 'not an independent ranking', 'No app guarantees productivity']) assert.ok(html.includes(phrase));
  assert.ok((await read('out/llms.txt')).includes(`https://nonlate.app${route('en')}`));
});
