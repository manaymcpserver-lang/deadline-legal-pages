import fs from "node:fs";
import path from "node:path";
const locales = JSON.parse(fs.readFileSync("app/guides/locales.json", "utf8"));
const preview = process.env.NONLATE_PREVIEW_LOCALES?.split(",");
for (const locale of locales.filter((code) => !preview || code === "en" || preview.includes(code))) {
  const file = path.join("out", locale === "en" ? "" : locale, "index.html");
  const direction = ["ar", "fa", "he", "ur"].includes(locale) ? "rtl" : "ltr";
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<html\b[^>]*>/, (tag) => tag.replace(/\slang="[^"]*"/, ` lang="${locale}"`).replace(/\sdir="[^"]*"/, ` dir="${direction}"`));
  fs.writeFileSync(file, html);
}
console.log(`Finalized language and direction for ${locales.length} static homepages`);
