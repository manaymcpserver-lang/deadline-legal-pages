import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createHash } from "node:crypto";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const locales = JSON.parse(await read("app/guides/locales.json"));
const pathFor = (locale) => locale === "en" ? "/" : `/${locale}/`;
const stripScripts = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
const jsonLd = (html) => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
const mediaSources = (html) => [...stripScripts(html).matchAll(/<(?:video|source)\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]).sort();

test("localized store illustrations match language, screen and platform without changing English", async () => {
  const artwork = JSON.parse(await read("app/homepage-artwork.json"));
  assert.equal(Object.keys(artwork.assets).length, 46);
  for (const slot of ['ios-home','ios-tasks','ios-planner','ios-blocker','android-blocker','android-schedule','android-insights']) {
    assert.equal(Object.values(artwork.assets).filter(x => x[`/assets/screens/${slot}.png`]).length, 46, `${slot}: every non-English homepage needs matching artwork`);
  }
  assert.ok(artwork.assets.ur, "Urdu store locale ur-PK must be normalized");
  const english = stripScripts(await read("out/index.html"));
  assert.doesNotMatch(english, /data-artwork-kind="store-illustration"/);
  for (const locale of locales.filter(x => x !== "en")) {
    const body = stripScripts(await read(`out/${locale}/index.html`));
    for (const [original, asset] of Object.entries(artwork.assets[locale] ?? {})) {
      assert.match(original, /\/(?:ios-(?:home|tasks|planner|blocker)|android-(?:blocker|schedule|insights))\.png$/);
      if (original.includes('/android-')) {
        assert.equal(asset.platform, 'Android');
        if (asset.kind === 'store-illustration') assert.equal(asset.source.store, 'Google Play');
      }
      assert.equal(asset.language, locale);
      assert.ok(['store-illustration','website-illustration'].includes(asset.kind));
      if (asset.kind === 'website-illustration') assert.equal(asset.source.notUploadedToStores, true);
      assert.ok(body.includes(`src="${asset.src}"`), `${locale}: missing illustration ${original}`);
      const bytes = await readFile(new URL(`public${asset.src}`, root));
      assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
      if (original.includes('/android-') && bytes.subarray(1,4).toString() === 'PNG') {
        assert.equal(bytes.readUInt32BE(16), 1080, `${locale}: use the full-size Play preview, not its thumbnail`);
        assert.equal(bytes.readUInt32BE(20), 1920);
      }
    }
    for (const screen of ["schedule", "blocker", "insights"]) {
      const slot = `/assets/screens/android-${screen}.png`;
      const expected = artwork.assets[locale]?.[slot]?.src ?? slot;
      assert.ok(body.includes(`src="${expected}"`), `${locale}: must use a matching Android image or the labelled English Android fallback`);
    }
  }
});

test("website Tasks illustrations keep all service names and intact provider icons", async () => {
  const audit = JSON.parse(await read('translations/website-artwork/render-audit.json'));
  const tasks = audit.filter(x => x.slot === 'ios-tasks');
  assert.equal(tasks.length, 46);
  for (const item of tasks) {
    assert.deepEqual(item.brokenImages, []);
    assert.equal(item.iconCount, 4, `${item.locale}: retain the four original provider icons`);
    for (const brand of ['Canvas','Notion','Slack','Google Tasks']) assert.ok(item.visibleText.includes(brand), `${item.locale}: ${brand}`);
    assert.doesNotMatch(item.visibleText, /See your whole schedule|One list for every source|Submit biology lab|Search tasks\.\.\./);
    const source = await read(`translations/website-artwork/${item.locale}/ios-tasks.html`);
    assert.doesNotMatch(source, /\{\{|src="assets\//);
    for (const name of ['canvas','notion','slack','google_tasks']) {
      const icon = await readFile(new URL(`public/assets/integrations/${name}.png`, root));
      assert.ok(source.includes(icon.toString('base64')), `${item.locale}: original ${name} icon bytes must not change`);
    }
  }
  const insights = await read('translations/website-artwork/or/android-insights.html');
  assert.doesNotMatch(insights, /sc-for|\{\{/);
  assert.equal((insights.match(/height:11px;border-radius:3px;background:/g) ?? []).length, 30);
});

test("homepage dictionaries cover every extracted unit in all app-supported languages", async () => {
  const source = JSON.parse(await read("translations/homepage/source.json"));
  for (const locale of locales.filter((code) => code !== "en")) {
    const dictionary = JSON.parse(await read(`translations/homepage/${locale}.json`));
    assert.deepEqual(Object.keys(dictionary.strings).sort(), [...source.strings].sort(), `${locale}: missing or stale homepage keys`);
    for (const [key, value] of Object.entries(dictionary.strings)) {
      assert.ok(typeof value === "string" && value.trim(), `${locale}: empty ${key}`);
      assert.doesNotMatch(value, /NONLATEX\d+TOKEN|⟦NL|<script\b|\b(?:undefined|null)\b/);
      const placeholders = (text) => [...text.matchAll(/\{[a-z]+\}/g)].map((match) => match[0]).sort();
      assert.deepEqual(placeholders(value), placeholders(key), `${locale}: interpolation in ${key}`);
      const prices = (text) => [...text.matchAll(/\$\d+(?:\.\d+)?/g)].map((match) => match[0]).sort();
      assert.deepEqual(prices(value), prices(key), `${locale}: reference USD prices in ${key}`);
    }
  }
});

test("website does not promise free on-device syncing or an obsolete Planner plus button", async () => {
  const english = stripScripts(await read("out/index.html"));
  assert.doesNotMatch(english, /On-device calendars and reminders stay free|Manual tasks and on-device calendars and reminders stay free|Tap \+ to add to plan/);
  assert.match(english, /Drag tasks here/);
  assert.match(english, /One source for 30 days/);
});

test("all language homepages preserve sections, videos, downloads and localized FAQ schema", async () => {
  const english = await read("out/index.html");
  const expectedMedia = mediaSources(english);
  assert.ok(expectedMedia.length, "English homepage must retain its videos");
  for (const locale of locales) {
    const path = pathFor(locale);
    const html = await read(`out${path}index.html`);
    assert.doesNotMatch(html, /\/Users\/manay\/|"localFile"|"sourceFile"/, `${locale}: local artwork provenance must not ship in the client payload`);
    const body = stripScripts(html);
    assert.match(html, new RegExp(`<html[^>]*\\blang="${locale}"`), `${locale}: initial document language`);
    if (["ar", "fa", "he", "ur"].includes(locale)) assert.match(html, /<html[^>]*\bdir="rtl"/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://nonlate.app${path}"`));
    assert.equal((body.match(/<h1\b/g) ?? []).length, 1);
    assert.deepEqual(mediaSources(html), expectedMedia, `${locale}: videos must not change`);
    for (const id of ["moment", "product", "tasks", "integrations", "plans", "privacy", "faq", "coming-soon"]) assert.ok(body.includes(`id="${id}"`), `${locale}: missing section ${id}`);
    for (const url of ["https://apps.apple.com/app/id6759996284", "https://play.google.com/store/apps/details?id=com.nonlate.app"]) assert.ok(body.includes(`href="${url}"`), `${locale}: store link changed`);
    for (const target of locales) {
      const hrefLang = target === "fil" ? "tl" : target;
      assert.ok(new RegExp(`<link rel="alternate" href[Ll]ang="${hrefLang}" href="https://nonlate.app${pathFor(target)}"`).test(html), `${locale}: missing alternate ${target}`);
      assert.ok(body.includes(`href="${pathFor(target)}"`), `${locale}: missing language link ${target}`);
    }
    const graph = jsonLd(html).flatMap((data) => data["@graph"] ?? [data]);
    const faq = graph.find((data) => data["@type"] === "FAQPage");
    assert.equal(faq?.mainEntity?.length, 10, `${locale}: all ten Q&A entries required`);
    const visibleText = body.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');
    for (const entry of faq.mainEntity) {
      assert.ok(visibleText.includes(entry.name), `${locale}: schema question not visible`);
      assert.ok(visibleText.includes(entry.acceptedAnswer.text), `${locale}: schema answer not visible`);
    }
  }
});

test("homepage and guide language URLs share a complete sitemap", async () => {
  const xml = await read("out/sitemap.xml");
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(new Set(urls).size, urls.length);
  assert.equal(urls.length, 383);
  for (const locale of locales) assert.ok(urls.includes(`https://nonlate.app${pathFor(locale)}`));
});

test("language rendering avoids ICU and saved-break hydration mismatches", async () => {
  const provider = await read("app/components/WebsiteLocale.tsx");
  const page = await read("app/HomePage.tsx");
  const css = await read("app/globals.css");
  assert.doesNotMatch(provider, /Intl\.DisplayNames/);
  const names = JSON.parse(await read("app/guides/language-names.json"));
  assert.equal(names.or, "ଓଡ଼ିଆ", "native Odia name must agree on server and browser");
  assert.match(provider, /guides\/language-names\.json/);
  assert.match(page, /\[breakLeft, setBreakLeft\] = useState\(0\)/);
  assert.match(page, /requestAnimationFrame\([\s\S]*?getSavedBreakSeconds\(\)/);
  assert.match(css, /\[dir="rtl"\] \.screen-rail[^}]*direction:\s*ltr/);
});

test("unreviewed translations cannot silently enter a normal release build", async () => {
  const homepage = await read("app/homepage-locale.ts");
  const guides = await read("scripts/localize-guides.py");
  const workflow = await read(".github/workflows/deploy-pages.yml");
  assert.match(homepage, /!allowDraft && dictionary\.reviewStatus !== "approved"/);
  assert.match(homepage, /Production export is blocked/);
  assert.match(guides, /values\.get\("reviewStatus"\) != "approved" and not allow_draft/);
  assert.match(guides, /noindex, nofollow/);
  assert.doesNotMatch(workflow, /NONLATE_TRANSLATION_DRAFT|NONLATE_PREVIEW_LOCALES/);
  assert.doesNotMatch(guides, /translate\.googleapis\.com|subprocess|urllib/);
});
