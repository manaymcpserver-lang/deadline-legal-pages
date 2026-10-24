// Add a small progressive enhancement after translation rendering. In particular,
// localized articles/policies remain static and never hydrate back to English.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { languageNames, prompts } from "../public/language-suggestion.js";

const locales = JSON.parse(readFileSync("app/guides/locales.json", "utf8"));
if (JSON.stringify(Object.keys(languageNames).sort()) !== JSON.stringify([...locales].sort()) || JSON.stringify(Object.keys(prompts).sort()) !== JSON.stringify([...locales].sort())) throw Error("Language suggestion must cover every supported locale");
const origin = "https://nonlate.app";
const routes = new Set([...readFileSync("out/sitemap.xml", "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => {
  const url = new URL(value);
  if (url.origin !== origin) throw Error("Unexpected sitemap origin");
  return url.pathname;
}));
const escaped = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
for (const route of routes) {
  const guide = route.startsWith("/guides/");
  const prefix = guide ? "/guides/" : "/";
  const parts = route.slice(prefix.length).split("/").filter(Boolean);
  const current = locales.includes(parts[0]) ? parts.shift() : "en";
  const suffix = parts.length ? parts.join("/") + "/" : "";
  const available = Object.fromEntries(locales.flatMap(locale => {
    const target = prefix + (locale === "en" ? "" : `${locale}/`) + suffix;
    return routes.has(target) ? [[locale, target]] : [];
  }));
  if (!available[current]) throw Error(`Missing current language for ${route}`);
  const file = join("out", route, "index.html");
  let html = readFileSync(file, "utf8");
  if (html.includes("data-language-suggestion")) throw Error(`Duplicate suggestion injection: ${route}`);
  html = html.replace("</head>", '<link rel="stylesheet" href="/language-suggestion.css"></head>');
  html = html.replace("</body>", `<script type="module" src="/language-suggestion.js" data-language-suggestion data-current-language="${current}" data-language-targets="${escaped(JSON.stringify(available))}"></script></body>`);
  writeFileSync(file, html);
}
console.log(`Added optional language suggestions to ${routes.size} static pages; no automatic redirects`);
