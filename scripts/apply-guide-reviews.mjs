import { readFileSync, writeFileSync } from "node:fs";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const source = read("translations/guides/source.json");
const reviews = read("translations/guides/reviews.json");
if (source.sourceHash !== reviews.sourceHash) throw new Error("Guide review belongs to an older source; reconcile it before applying");
for (const [locale, review] of Object.entries(reviews.locales)) {
  if (review.reviewedUnits !== source.strings.length) throw new Error(`${locale}: incomplete review record`);
  const file = `translations/guides/${locale}.json`;
  const dictionary = read(file);
  if (dictionary.sourceHash !== source.sourceHash) throw new Error(`${locale}: stale guide dictionary`);
  const homepage = read(`translations/homepage/${locale}.json`);
  // Reuse reviewed shared website chrome, never unreviewed model output.
  if (homepage.reviewStatus === "in-session-reviewed") {
    for (const key of source.strings) if (homepage.strings[key]) dictionary.strings[key] = homepage.strings[key];
  }
  for (const [index, value] of Object.entries({ ...review.corrections, ...reviews.inlineCorrections?.[locale] })) {
    const key = source.strings[Number(index)];
    if (!key || typeof value !== "string" || !value.trim()) throw new Error(`${locale}: invalid reviewed unit ${index}`);
    dictionary.strings[key] = value;
  }
  for (const key of source.strings) if (!dictionary.strings[key]?.trim()) throw new Error(`${locale}: missing ${key}`);
  dictionary.reviewStatus = "in-session-reviewed";
  dictionary.reviewedUnits = source.strings.length;
  dictionary.method = "In-session source-by-source semantic review with corrections; AI-assisted, not native-speaker certification or release approval.";
  writeFileSync(file, `${JSON.stringify(dictionary, null, 2)}\n`);
  console.log(`${locale}: ${source.strings.length} guide units reviewed`);
}
