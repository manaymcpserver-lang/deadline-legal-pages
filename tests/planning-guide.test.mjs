import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../out/", import.meta.url);
const route = "/guides/a-deadline-is-not-a-plan/";
const read = (path) => readFile(new URL(path, root), "utf8");
const visible = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

test("planning article has canonical metadata, attribution and accurate task semantics", async () => {
  const html = await read(`${route.slice(1)}index.html`);
  const body = visible(html);
  assert.equal((body.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(html.includes(`rel="canonical" href="https://nonlate.app${route}"`));
  assert.match(body, /October 22, 2026/);
  assert.match(body, /published by the maker of Nonlate/);
  for (const phrase of ["plan uses the task’s name", "Calendar events do not trigger blocking", "does not verify", "does not change the task’s deadline", "not, by itself, a command to block"]) assert.ok(body.includes(phrase), phrase);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const article = schema['@graph'].find(item => item['@type'] === 'Article');
  assert.equal(article.datePublished, '2026-10-22');
  assert.equal(article.inLanguage, 'en');
  assert.equal(article.mainEntityOfPage, `https://nonlate.app${route}`);
  assert.ok(body.includes(article.headline));
  for (const [, id] of body.matchAll(/href="#([a-z-]+)"/g)) assert.ok(body.includes(`id="${id}"`));
  assert.match(body, /https:\/\/apps.apple.com\/app\/id6759996284/);
  assert.match(body, /https:\/\/play.google.com\/store\/apps\/details\?id=com.nonlate.app/);
  assert.ok(body.includes('href="/guides/es/a-deadline-is-not-a-plan/"'));
  assert.ok(body.includes('href="/guides/ja/"'));
  assert.ok(!body.includes('/guides/ja/a-deadline-is-not-a-plan/'));
});

test("guide indexes link to available translations and label the English fallback", async () => {
  const locales = JSON.parse(await readFile(new URL("../app/guides/locales.json", import.meta.url), "utf8"));
  const translated = JSON.parse(await readFile(new URL("../app/guides/planning-locales.json", import.meta.url), "utf8"));
  for (const locale of locales) {
    const body = visible(await read(`guides/${locale === 'en' ? '' : `${locale}/`}index.html`));
    if (locale !== 'en' && translated.includes(locale)) {
      const card = body.match(new RegExp(`<article[^>]*lang="${locale}"[\\s\\S]*?<\\/article>`))?.[0];
      assert.ok(card, `${locale}: localized card`);
      assert.ok(card.includes(`href="/guides/${locale}/a-deadline-is-not-a-plan/"`));
      assert.ok(!card.includes('Read in English'));
      continue;
    }
    const card = body.match(/<article[^>]*lang="en"[\s\S]*?<\/article>/)?.[0];
    assert.ok(card, `${locale}: English-language card`);
    assert.ok(card.includes(`href="${route}"`), locale);
    assert.match(card, /dir="ltr"/);
    assert.match(card, /Read in English/);
  }
  assert.ok((await read('sitemap.xml')).includes(`https://nonlate.app${route}`));
  assert.ok((await read('llms.txt')).includes(`https://nonlate.app${route}`));
});

test("planning translations are complete, preserve brands, and have reciprocal article links", async () => {
  const locales = JSON.parse(await readFile(new URL("../app/guides/planning-locales.json", import.meta.url), "utf8"));
  const source = JSON.parse(await readFile(new URL("../translations/planning-guide/source.json", import.meta.url), "utf8"));
  for (const locale of locales.filter(code => code !== 'en')) {
    const dictionary = JSON.parse(await readFile(new URL(`../translations/planning-guide/${locale}.json`, import.meta.url), "utf8"));
    assert.equal(dictionary.sourceHash, source.sourceHash);
    assert.equal(dictionary.reviewStatus, 'approved');
    assert.deepEqual(Object.keys(dictionary.strings).sort(), [...source.strings].sort());
    for (const [original, translated] of Object.entries(dictionary.strings)) {
      assert.ok(translated.trim());
      for (const brand of ['Nonlate', 'Android', 'iPhone', 'Canvas', 'Moodle', 'Notion', 'Todoist', 'Google Tasks', 'Planner', 'Schedule', 'Tasks']) {
        if (original.includes(brand)) assert.ok(translated.includes(brand), `${locale}: ${brand} missing`);
      }
    }
    const path = `/guides/${locale}/a-deadline-is-not-a-plan/`;
    const html = await read(`${path.slice(1)}index.html`);
    const body = visible(html);
    assert.ok(html.includes(`<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`));
    assert.ok(html.includes(`rel="canonical" href="https://nonlate.app${path}"`));
    assert.equal((body.match(/<h1\b/g) ?? []).length, 1);
    for (const other of locales) {
      const target = `/guides/${other === 'en' ? '' : `${other}/`}a-deadline-is-not-a-plan/`;
      assert.ok(body.includes(`href="${target}"`), `${locale} -> ${other}`);
      assert.ok(html.includes(`href="https://nonlate.app${target}"`));
    }
    assert.ok(body.includes('href="/guides/ja/"'));
    assert.ok(!body.includes('/guides/ja/a-deadline-is-not-a-plan/'));
    assert.ok(body.includes(`href="/guides/${locale}/block-distracting-apps-until-tasks-are-done/"`));
    assert.ok(body.includes(`href="/guides/${locale}/"`));
    assert.ok(!body.includes('href="/guides/"'));
    assert.ok(!body.includes('The short answer'));
    assert.doesNotMatch(html, /<script(?![^>]*application\/ld\+json)/i);
    assert.match(body, /class="guide-translation-note"/);
    const schema = JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
    const article = schema['@graph'].find(item => item['@type'] === 'Article');
    assert.equal(schema['@graph'].find(item => item['@type'] === 'BreadcrumbList').itemListElement[1].item, `https://nonlate.app/guides/${locale}/`);
    assert.equal(article.inLanguage, locale);
    assert.equal(article.mainEntityOfPage, `https://nonlate.app${path}`);
    assert.ok(body.includes(article.headline));
    for (const [, id] of body.matchAll(/href="#([a-z-]+)"/g)) assert.ok(body.includes(`id="${id}"`));
  }
});
