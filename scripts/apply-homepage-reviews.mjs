import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const directory = path.resolve("translations/homepage");
const source = JSON.parse(readFileSync(path.join(directory, "source.json"), "utf8"));
const sourceHash = createHash("sha256").update(`[${source.strings.map((text) => JSON.stringify(text)).join(", ")}]`).digest("hex");
const indexedSourceHash = "6b8c1a9896b789046ecaf2dc4ebd476a244182d1812d1e6fdbb02f686e910d37";
const manualDirectory = path.join(directory, "manual");
for (const name of readdirSync(manualDirectory).filter((file) => file.endsWith(".json"))) {
  const locale = name.replace(/\.json$/, "");
  const manual = JSON.parse(readFileSync(path.join(manualDirectory, name), "utf8"));
  if (manual.byIndex && sourceHash !== indexedSourceHash) throw new Error(`${locale}: indexed review belongs to an older source; reconcile it before applying`);
  const entries = manual.byIndex
    ? Object.fromEntries(Object.entries(manual.byIndex).map(([index, value]) => {
      if (!source.strings[Number(index)]) throw new Error(`Invalid ${locale} source index ${index}`);
      return [source.strings[Number(index)], value];
    }))
    : manual.strings ?? manual;
  for (const key of source.strings) {
    if (typeof entries[key] !== "string" || !entries[key].trim()) throw new Error(`${locale}: review is incomplete: ${key}`);
    const tokens = (text) => [...text.matchAll(/\{[a-z]+\}/g)].map((match) => match[0]).sort().join("|");
    if (tokens(key) !== tokens(entries[key])) throw new Error(`${locale}: review changed interpolation tokens`);
  }
  const file = path.join(directory, name);
  const previous = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
  const dictionary = {
    ...previous, locale, sourceHash,
    reviewStatus: "in-session-reviewed",
    method: "In-session translation and semantic review; not native-speaker certification. Layout QA and screenshot matching remain separate release requirements.",
    unresolvedUnits: [], protectedSegmentFallbacks: [],
    strings: Object.fromEntries(source.strings.map((key) => [key, entries[key]])),
  };
  // In-session review is not release approval. A separate explicit approval is
  // required after rendered QA; the default production build remains gated.
  writeFileSync(file, `${JSON.stringify(dictionary, null, 2)}\n`);
  console.log(`${locale}: merged ${source.strings.length} manually reviewed units`);
}

// Targeted repairs do not imply a full-language review or release approval.
const correctionsFile = path.join(directory, "corrections.json");
if (existsSync(correctionsFile)) {
  for (const [locale, repairs] of Object.entries(JSON.parse(readFileSync(correctionsFile, "utf8")))) {
    const file = path.join(directory, `${locale}.json`);
    if (!existsSync(file)) throw new Error(`${locale}: cannot repair a missing draft`);
    const dictionary = JSON.parse(readFileSync(file, "utf8"));
    // A later full review supersedes the earlier targeted model repairs.
    if (dictionary.reviewStatus === "in-session-reviewed" && existsSync(path.join(manualDirectory, `${locale}.json`))) continue;
    for (const [key, value] of Object.entries(repairs)) {
      if (!source.strings.includes(key) || typeof value !== "string" || !value.trim()) throw new Error(`${locale}: invalid targeted repair`);
      const tokens = (text) => [...text.matchAll(/\{[a-z]+\}/g)].map((match) => match[0]).sort().join("|");
      if (tokens(key) !== tokens(value)) throw new Error(`${locale}: targeted repair changed interpolation`);
      dictionary.strings[key] = value;
    }
    dictionary.targetedReviewedUnits = Object.keys(repairs);
    dictionary.unresolvedUnits = (dictionary.unresolvedUnits ?? []).filter((unit) => !(unit.source in repairs));
    writeFileSync(file, `${JSON.stringify(dictionary, null, 2)}\n`);
    console.log(`${locale}: repaired ${Object.keys(repairs).length} flagged units; full-language status unchanged`);
  }
}
