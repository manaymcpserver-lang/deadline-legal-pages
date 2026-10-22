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
  for (const phrase of ["plan uses the task’s name", "Calendar events do not trigger blocking", "does not verify", "does not change the task’s deadline", "currently available in English", "not, by itself, a command to block"]) assert.ok(body.includes(phrase), phrase);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const article = schema['@graph'].find(item => item['@type'] === 'Article');
  assert.equal(article.datePublished, '2026-10-22');
  assert.equal(article.inLanguage, 'en');
  assert.equal(article.mainEntityOfPage, `https://nonlate.app${route}`);
  assert.ok(body.includes(article.headline));
  for (const [, id] of body.matchAll(/href="#([a-z-]+)"/g)) assert.ok(body.includes(`id="${id}"`));
  assert.match(body, /https:\/\/apps.apple.com\/app\/id6759996284/);
  assert.match(body, /https:\/\/play.google.com\/store\/apps\/details\?id=com.nonlate.app/);
  assert.ok(body.includes('href="/guides/es/"'));
  assert.ok(!body.includes('/guides/es/a-deadline-is-not-a-plan/'));
});

test("all guide indexes expose the English article honestly without changing existing translations", async () => {
  const locales = JSON.parse(await readFile(new URL("../app/guides/locales.json", import.meta.url), "utf8"));
  for (const locale of locales) {
    const body = visible(await read(`guides/${locale === 'en' ? '' : `${locale}/`}index.html`));
    const card = body.match(/<article[^>]*lang="en"[\s\S]*?<\/article>/)?.[0];
    assert.ok(card, `${locale}: English-language card`);
    assert.ok(card.includes(`href="${route}"`), locale);
    assert.match(card, /dir="ltr"/);
    assert.match(card, /Read in English/);
  }
  assert.ok((await read('sitemap.xml')).includes(`https://nonlate.app${route}`));
  assert.ok((await read('llms.txt')).includes(`https://nonlate.app${route}`));
});
