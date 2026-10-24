import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const locales = JSON.parse(await read("app/guides/locales.json"));
const artwork = JSON.parse(await read("app/guides/artwork.json"));
const homepageArtwork = JSON.parse(await read("app/homepage-artwork.json"));
const suffix = "block-distracting-apps-until-tasks-are-done/";
const route = (locale, article = false) => `/guides/${locale === "en" ? "" : `${locale}/`}${article ? suffix : ""}`;
const visible = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "");

test("guide languages match the 47 supported app variants with no generic Portuguese duplicate", () => {
  assert.equal(locales.length, 47);
  assert.equal(new Set(locales).size, locales.length);
  for (const locale of ["pt-BR", "pt-PT", "zh-Hans", "zh-Hant", "fil", "nb", "ar", "fa", "he", "ur", "or", "pa"]) assert.ok(locales.includes(locale));
  assert.ok(!locales.includes("pt"));
});

test("every guide dictionary is complete, nonempty and protects brands", async () => {
  const source = JSON.parse(await read("translations/guides/source.json"));
  const sourceKeys = [...source.strings].sort();
  // Substrings intentionally allow normal grammatical suffixes (e.g. Finnish
  // Nonlatein). Plus/Pro can also be ordinary words in translated prose.
  const protectedTerms = /Nonlate|iPhone|iOS|Android|App Store|Google Play|Focus Lock|Screen Time/g;
  for (const locale of locales.filter((code) => code !== "en")) {
    const dictionary = JSON.parse(await read(`translations/guides/${locale}.json`));
    assert.equal(dictionary.sourceHash, source.sourceHash, `${locale}: source hash`);
    assert.deepEqual(Object.keys(dictionary.strings).sort(), sourceKeys, `${locale}: missing keys`);
    for (const [key, value] of Object.entries(dictionary.strings)) {
      assert.ok(typeof value === "string" && value.trim(), `${locale}: empty translation`);
      assert.doesNotMatch(value, /NONLATEX\d+TOKEN|⟦NL|<script\b/i);
      assert.deepEqual([...value.matchAll(protectedTerms)].map((m) => m[0]).sort(), [...key.matchAll(protectedTerms)].map((m) => m[0]).sort(), `${locale}: protected names in ${key}`);
      for (const tier of ["Plus", "Pro"]) if (new RegExp(`\\b${tier}\\b`).test(key)) assert.ok(value.includes(tier), `${locale}: missing ${tier}`);
    }
    const changed = sourceKeys.filter((key) => dictionary.strings[key] !== key);
    assert.ok(changed.length > sourceKeys.length * .8, `${locale}: untranslated body`);
    if (dictionary.reviewStatus === "in-session-reviewed") {
      // The complete sentence and its inline links are translated together.
      // Otherwise the static renderer would append duplicate fallback labels.
      for (const [paragraph, links] of [[35, [102, 107, 106]], [47, [101]], [96, [70]], [100, [105]]]) {
        for (const link of links) assert.ok(dictionary.strings[source.strings[paragraph]].includes(dictionary.strings[source.strings[link]]), `${locale}: reviewed inline link ${link} must fit paragraph ${paragraph}`);
      }
    }
  }
});

test("all 94 guide pages have reciprocal language links, matching canonicals and store links", async () => {
  for (const locale of locales) {
    for (const article of [false, true]) {
      const path = route(locale, article);
      const html = await read(`out${path}index.html`);
      const body = visible(html);
      assert.match(html, new RegExp(`<link rel="canonical" href="https://nonlate.app${path}"`));
      assert.equal((body.match(/<h1\b/g) ?? []).length, 1, path);
      for (const target of locales) {
        const hreflang = target === "fil" ? "tl" : target;
        assert.ok(new RegExp(`<link rel="alternate" href[Ll]ang="${hreflang}" href="https://nonlate.app${route(target, article)}"`).test(html), `${path}: alternate ${hreflang}`);
        assert.ok(body.includes(`href="${route(target, article)}"`), `${path}: language switch ${target}`);
      }
      assert.ok(html.includes(`href="https://nonlate.app${route("en", article)}"`));
      if (locale !== "en") {
        assert.ok(html.includes(`<html lang="${locale}" dir="${["ar","fa","he","ur"].includes(locale) ? "rtl" : "ltr"}"`));
        assert.doesNotMatch(html, /<script(?![^>]*application\/ld\+json)/i, `${path}: unnecessary client bundle`);
        assert.ok(body.includes(`href="${route(locale)}"`));
        assert.ok(body.includes(`class="guide-translation-note"`));
        assert.doesNotMatch(body, /<button\b/, `${path}: dead JavaScript control`);
        assert.doesNotMatch(body, /href="\/#/, `${path}: homepage section links must preserve language`);
        const footerMenu = body.match(/<details[^>]*data-language-switcher[^>]*>([\s\S]*?)<\/details>/)?.[1];
        assert.ok(footerMenu, `${path}: footer language selector`);
        for (const target of locales) assert.ok(footerMenu.includes(`href="${route(target, article)}"`), `${path}: footer preserves guide for ${target}`);
        assert.ok(new RegExp(`lang="${locale}"[^>]*aria-current="page"`).test(footerMenu), `${path}: footer current language`);
      }
      if (article) {
        if (locale !== "en") {
          const androidAsset = homepageArtwork.assets[locale]?.['/assets/screens/android-blocker.png'];
          if (androidAsset) {
            assert.ok(body.includes(`src="${androidAsset.src}"`), `${locale}: matching Android illustration`);
            const labels = JSON.parse(await read('translations/play-media-labels.json'));
            assert.ok(body.includes(androidAsset.kind === 'website-illustration' ? 'Nonlate · Android' : labels[locale]), `${locale}: correct artwork attribution`);
          } else assert.ok(body.includes('data-artwork-kind="english-screenshot"'), `${locale}: Android fallback must be labeled`);
          const asset = artwork.assets[locale];
          if (asset) {
            assert.ok(body.includes(`src="${asset.src}"`), `${locale}: matching localized illustration`);
            assert.ok(body.includes(`data-artwork-kind="${asset.kind ?? 'store-illustration'}"`), `${locale}: illustration must not be misrepresented as a raw screenshot`);
          }
        }
        assert.match(html, /https:\/\/apps.apple.com\/app\/id6759996284/);
        assert.match(html, /https:\/\/play.google.com\/store\/apps\/details\?id=com.nonlate.app/);
        const schema = JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
        const data = schema["@graph"].find((item) => item["@type"] === "Article");
        assert.equal(data.inLanguage, locale);
        assert.equal(data.mainEntityOfPage, `https://nonlate.app${path}`);
        assert.equal(data.author.name, "Nonlate");
        if (locale !== "en") {
          const breadcrumb = schema["@graph"].find((item) => item["@type"] === "BreadcrumbList");
          assert.equal(breadcrumb.itemListElement[0].item, `https://nonlate.app/${locale}/`);
        }
        assert.ok(body.includes(data.headline));
        for (const [, id] of body.matchAll(/href="#([a-z-]+)"/g)) assert.ok(body.includes(`id="${id}"`));
      }
    }
  }
});

test("localized routes are fully discoverable in the sitemap", async () => {
  const sitemap = await read("out/sitemap.xml");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.equal(new Set(urls).size, urls.length);
  assert.equal(urls.length, 383);
  for (const locale of locales) for (const article of [false,true]) assert.ok(urls.includes(`https://nonlate.app${route(locale,article)}`));
});
