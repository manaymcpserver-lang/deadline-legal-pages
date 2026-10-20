import { readFileSync, writeFileSync } from "node:fs";

// Preserve the canonical public pages, then add every translated landing page
// and guide exactly once. OAuth and app association URLs are never rewritten.
const locales = JSON.parse(readFileSync(new URL("../app/guides/locales.json", import.meta.url), "utf8"));
const output = new URL("../out/sitemap.xml", import.meta.url);
const xml = readFileSync(output, "utf8");
const existing = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const added = [];
for (const locale of locales.filter((code) => code !== "en")) {
 for (const suffix of ['', 'privacy/', 'terms/', 'support/', 'data-deletion/']) {
  const url = `https://nonlate.app/${locale}/${suffix}`;
  if (!existing.has(url)) {
    existing.add(url);
    added.push(`  <url><loc>${url}</loc></url>`);
  }
 }
}
writeFileSync(output, xml.replace("</urlset>", `${added.join("\n")}\n</urlset>`));
console.log(`Language sitemap contains ${existing.size} canonical pages.`);
