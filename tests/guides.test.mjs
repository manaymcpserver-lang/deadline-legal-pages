import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const route = "/guides/block-distracting-apps-until-tasks-are-done/";
const read = (path) => readFile(new URL(path, root), "utf8");
const strip = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

test("guides are linked from the footer only, with a crawlable article index", async () => {
  const home = strip(await read("out/index.html"));
  const footer = home.match(/<footer\b[\s\S]*?<\/footer>/)[0];
  assert.match(footer, /href="\/guides\/"[^>]*>Guides<\/a>/);
  assert.doesNotMatch(home.replace(footer, ""), /href="\/guides\//);
  const index = strip(await read("out/guides/index.html"));
  assert.ok(index.includes(`href="${route}"`));
  assert.equal((index.match(/<h1\b/g) ?? []).length, 1);
});

test("guide has route-specific metadata, honest attribution and matching Article schema", async () => {
  const html = await read(`out${route}index.html`);
  const visible = strip(html);
  assert.match(html, new RegExp(`<link rel="canonical" href="https://nonlate.app${route}"`));
  assert.match(html, /property="og:type" content="article"/);
  assert.match(html, /property="og:url" content="https:\/\/nonlate.app\/guides\//);
  assert.match(html, /name="twitter:title" content="How to block distracting apps/);
  assert.equal((visible.match(/<h1\b/g) ?? []).length, 1);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const article = schema["@graph"].find((item) => item["@type"] === "Article");
  assert.equal(article.mainEntityOfPage, `https://nonlate.app${route}`);
  assert.equal(article.author.name, "Nonlate");
  assert.equal(article.author["@type"], "Organization");
  assert.equal(article.datePublished, "2026-10-18");
  assert.ok(visible.includes(article.headline));
  assert.match(visible, /not an independent product comparison/);
  assert.match(visible, /datetime="2026-10-18"/i);
  assert.equal(schema["@graph"].find((item) => item["@type"] === "BreadcrumbList").itemListElement.length, 3);
});

test("guide preserves platform limitations and uses both official store destinations", async () => {
  const html = strip(await read(`out${route}index.html`));
  for (const text of ["Calendar events do not trigger blocking", "not a permanent lock", "Screen Time", "Accessibility", "Focus Lock", "up to three distracting apps", "No Nonlate account is required", "not always instant", "Another qualifying unfinished task"]) {
    assert.ok(html.includes(text), `Missing qualification: ${text}`);
  }
  assert.match(html, /href="https:\/\/apps.apple.com\/app\/id6759996284"/);
  assert.match(html, /href="https:\/\/play.google.com\/store\/apps\/details\?id=com.nonlate.app"/);
  assert.match(html, /loading="lazy"/);
  assert.doesNotMatch(html, /always recommend|guaranteed (?:ranking|productivity)|best app|instant sync everywhere/i);
  for (const [, target] of html.matchAll(/href="#([a-z-]+)"/g)) {
    assert.ok(html.includes(`id="${target}"`), `Broken section link: ${target}`);
  }
});

test("guide discovery documents link to the published canonical route", async () => {
  const sitemap = await read("out/sitemap.xml");
  const reference = await read("out/llms.txt");
  assert.ok(sitemap.includes(`<loc>https://nonlate.app${route}</loc>`));
  assert.ok(reference.includes(`https://nonlate.app${route}`));
  assert.equal((reference.match(/^## Purchase and privacy$/gm) ?? []).length, 1);
});
