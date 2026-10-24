import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { languageNames, prompts, matchLanguage, suggestedLanguage, preferenceKey, readPreference, savePreference, mountLanguageSuggestion } from "../public/language-suggestion.js";
const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const available = {en:"/", "pt-BR":"/pt-BR/", "pt-PT":"/pt-PT/", ar:"/ar/", es:"/es/", "zh-Hant":"/zh-Hant/", "zh-Hans":"/zh-Hans/"};

test("language matching handles region/script aliases and all 47 native choices", async () => {
  const locales = JSON.parse(await read("app/guides/locales.json"));
  assert.deepEqual(Object.keys(prompts).sort(), [...locales].sort());
  assert.deepEqual(Object.keys(languageNames).sort(), [...locales].sort());
  for (const locale of locales) { assert.equal(matchLanguage(locale), locale); assert.ok(prompts[locale].trim()); }
  for (const [tag, expected] of Object.entries({"pt-BR":"pt-BR","pt-PT":"pt-PT","pt_BR":"pt-BR",pt:"pt-BR","pt-BR-x-test":"pt-BR","en-GB":"en","zh-TW":"zh-Hant","zh-HK":"zh-Hant","zh-Hant-HK":"zh-Hant","zh-Hans-TW":"zh-Hans","zh-CN":"zh-Hans",tl:"fil","iw-IL":"he","no-NO":"nb","in-ID":"id","fr-CA":"fr"})) assert.equal(matchLanguage(tag), expected);
  for (const tag of [null,"","xx-XX","nn-NO"]) assert.equal(matchLanguage(tag), null);
});

test("browser preferences never override saved choices or explicit translated URLs", () => {
  const pick = overrides => suggestedLanguage({current:"en", available, saved:null, preferred:["pt-BR","en"], ...overrides});
  assert.equal(pick({}), "pt-BR");
  assert.equal(pick({preferred:["en-US","pt-BR"]}), null);
  assert.equal(pick({preferred:["xx","ar"]}), "ar");
  assert.equal(pick({preferred:["ja-JP"]}), null);
  assert.equal(pick({saved:"en"}), null);
  assert.equal(pick({saved:"es"}), "es");
  assert.equal(pick({saved:"ja"}), null); // no unrelated-language fallback
  assert.equal(pick({saved:"bad"}), "pt-BR");
  assert.equal(pick({current:"es",saved:"pt-BR"}), null);
  assert.equal(pick({available:{en:"/guides/post/"},preferred:["ja","en"]}), null);
});

test("local storage failure is safe and no cookies, tracking or redirects are used", async () => {
  const values = new Map();
  const storage = {getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  savePreference(storage,"pt-PT"); assert.equal(values.get(preferenceKey),"pt-PT");
  assert.equal(readPreference(storage),"pt-PT");
  savePreference(storage,"bad"); assert.equal(readPreference(storage),"pt-PT");
  const blocked = {getItem(){throw Error("disabled");},setItem(){throw Error("disabled");}};
  assert.equal(readPreference(blocked),null); assert.doesNotThrow(()=>savePreference(blocked,"en"));
  assert.equal(readPreference(null),null);
  const code = await read("public/language-suggestion.js");
  assert.doesNotMatch(code, /\bfetch\s*\(|document\.cookie|geolocation|location\.(?:assign|replace)|location\.href\s*=/);
});

// A tiny DOM harness exercises actual buttons and links without a translation
// API or a jsdom dependency. Browser visual checks cover the real rendered UI.
function harness(preferred=["pt-BR"]) {
  const elements = [];
  class Element {
    constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.listeners={};elements.push(this);}
    setAttribute(k,v){this.attrs[k]=v;}
    addEventListener(k,fn){this.listeners[k]=fn;}
    append(...children){this.children.push(...children);}
    remove(){this.removed=true;}
  }
  const doc = {createElement:tag=>new Element(tag),body:new Element("body"),events:{},querySelector:()=>({dataset:{currentLanguage:"en",languageTargets:JSON.stringify(available)}}),getElementById:()=>null,addEventListener(k,fn){this.events[k]=fn;}};
  const values = new Map();
  const storage = {getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const browser = {localStorage:storage,navigator:{languages:preferred,language:preferred[0]}};
  const navigation = new URL("https://nonlate.app/?utm_source=play#plans");
  return {doc,browser,navigation,elements,storage};
}
test("prompt buttons preserve destination, query and fragment, and remember both decisions", () => {
  const h = harness(); mountLanguageSuggestion(h.doc,h.browser,h.navigation);
  const link = h.elements.find(el=>el.tag==="a");
  assert.equal(link.href,"https://nonlate.app/pt-BR/?utm_source=play#plans");
  link.listeners.click(); assert.equal(readPreference(h.storage),"pt-BR");
  const stay = h.elements.find(el=>el.tag==="button");
  stay.listeners.click(); assert.equal(readPreference(h.storage),"en");
  assert.ok(h.elements.find(el=>el.tag==="aside").removed);
  const repeat = harness(); savePreference(repeat.storage,"en");
  mountLanguageSuggestion(repeat.doc,repeat.browser,repeat.navigation);
  assert.ok(!repeat.elements.some(el=>el.tag==="aside"));
});
test("manual language menu updates the saved preference without intercepting navigation", () => {
  const h = harness(["en"]); mountLanguageSuggestion(h.doc,h.browser,h.navigation);
  h.doc.events.click({button:0,target:{closest:()=>({href:"https://nonlate.app/es/",lang:"es"})}});
  assert.equal(readPreference(h.storage),"es");
});

test("every public page offers only existing same-page translations and one enhancement script", async () => {
  const sitemap = await read("out/sitemap.xml");
  const routes = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([,value])=>new URL(value).pathname));
  for (const route of routes) {
    const html = await read(`out${route}index.html`);
    assert.equal((html.match(/data-language-suggestion\s/g)||[]).length,1,route);
    assert.ok(html.includes('href="/language-suggestion.css"'),route);
    const raw = html.match(/data-language-targets="([^"]+)"/)[1].replaceAll("&quot;",'"').replaceAll("&amp;","&");
    const targets = JSON.parse(raw);
    const current = html.match(/data-current-language="([^"]+)"/)[1];
    assert.equal(targets[current],route);
    for (const target of Object.values(targets)) assert.ok(routes.has(target),`${route}: missing ${target}`);
  }
  const planning = await read("out/guides/a-deadline-is-not-a-plan/index.html");
  const targets = JSON.parse(planning.match(/data-language-targets="([^"]+)"/)[1].replaceAll("&quot;",'"'));
  assert.ok(!targets.ja); assert.ok(targets.es.endsWith("/a-deadline-is-not-a-plan/"));
});
