import { existsSync, readFileSync, writeFileSync } from "node:fs";

const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const locales = read("app/guides/locales.json");
const homepageSource = read("translations/homepage/source.json").strings;
const guideSource = read("translations/guides/source.json").strings;
const artwork = read("app/guides/artwork.json").assets;
const homepageArtwork = read("app/homepage-artwork.json");
const captureAudit = read("translations/screenshot-audit.json");
const rows = locales.map((locale) => {
  const row = { locale, homepage: {}, guides: {}, equivalentRawHomepageScreens: captureAudit.coverage[locale].exactHomepageScreens.length, localizedGuideIllustration: artwork[locale]?.src ?? null };
  for (const [name, source] of [["homepage", homepageSource], ["guides", guideSource]]) {
    const file = `translations/${name}/${locale}.json`;
    if (locale === "en") row[name] = { status: "original", complete: true, missingUnits: [], unresolvedUnits: [] };
    else if (!existsSync(file)) row[name] = { status: "pending", complete: false, missingUnits: source, unresolvedUnits: [] };
    else {
      const dictionary = read(file);
      const missingUnits = source.filter((key) => !dictionary.strings[key]?.trim());
      row[name] = { status: dictionary.reviewStatus ?? "draft", complete: !missingUnits.length, missingUnits, unresolvedUnits: dictionary.unresolvedUnits ?? [] };
    }
  }
  return row;
});
const report = {
  preparedOn: "2026-10-19",
  scope: "Website homepage, its FAQ, guide index and first guide only. Apps, existing in-app links, videos, English product terms, legal and support copy remain unchanged.",
  languages: locales.length,
  homepageSourceUnits: homepageSource.length,
  guideSourceUnits: guideSource.length,
  completeHomepageVariants: rows.filter((row) => row.homepage.complete).length,
  completeGuideVariants: rows.filter((row) => row.guides.complete).length,
  inSessionReviewedHomepageVariants: rows.filter((row) => row.homepage.status === "in-session-reviewed").map((row) => row.locale),
  inSessionReviewedGuideVariants: rows.filter((row) => row.guides.status === "in-session-reviewed").map((row) => row.locale),
  nativeSpeakerCertification: false,
  paidTranslationServicesUsed: false,
  localizedGuideIllustrationVariants: Object.keys(artwork).length,
  localizedHomepageIllustrationVariants: Object.keys(homepageArtwork.assets).length,
  localizedAndroidIllustrationVariants: Object.values(homepageArtwork.assets).filter((assets) => assets["/assets/screens/android-blocker.png"]).length,
  homepageImagePolicy: homepageArtwork.policy,
  readyForPublication: rows.every((row) => ["original", "approved"].includes(row.homepage.status) && ["original", "approved"].includes(row.guides.status)),
  remainingReleaseRequirements: [
    ...(rows.some((row) => !["original", "approved", "in-session-reviewed"].includes(row.homepage.status) || !["original", "approved", "in-session-reviewed"].includes(row.guides.status)) ? ["Semantic review of remaining drafts"] : []),
    "Explicit publication approval of the reviewed translations",
    ...(rows.some((row) => row.homepage.unresolvedUnits.length || row.guides.unresolvedUnits.length) ? ["Resolve flagged untranslated units"] : []),
    "Complete locale-by-locale visual review; automated links, metadata and sample mobile/RTL checks do not certify translation quality",
  ],
  rows,
};
writeFileSync("translations/status.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ languages: report.languages, completeHomepageVariants: report.completeHomepageVariants, completeGuideVariants: report.completeGuideVariants, inSessionReviewedHomepageVariants: report.inSessionReviewedHomepageVariants, inSessionReviewedGuideVariants: report.inSessionReviewedGuideVariants, readyForPublication: report.readyForPublication }, null, 2));
