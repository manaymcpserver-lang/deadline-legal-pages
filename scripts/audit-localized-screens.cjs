/* Read-only source audit. This never renders, edits, crops, or substitutes screenshots. */
/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS audit utility */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const appRoot = '/Users/manay/Desktop/DeadLine';
const locales = JSON.parse(fs.readFileSync(path.join(root, 'app/guides/locales.json')));
const slots = ['ios-home', 'ios-tasks', 'ios-planner', 'ios-blocker', 'android-schedule', 'android-blocker', 'android-insights'];
const artwork = JSON.parse(fs.readFileSync(path.join(root, 'app/guides/artwork.json')));
const qaDir = path.join(appRoot, 'artifacts/unified-calendars-2026-10-12/localized-screenshots');
const qaManifest = JSON.parse(fs.readFileSync(path.join(qaDir, 'manifest.json')));
const qaCaptures = qaManifest.flatMap(test => test.attachments.map(attachment => {
  const file = path.join(qaDir, attachment.exportedFileName);
  const bytes = fs.readFileSync(file);
  const [, locale, screen] = attachment.suggestedHumanReadableName.match(/^(\S+) large (\S+)_/);
  return {
    locale, platform: 'iOS', screen, file,
    width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20),
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    kind: 'real-device-large-text-QA-capture',
    testIdentifier: test.testIdentifier,
    equivalentHomepageScreenshot: false,
    reason: 'Large-text QA capture with test content and status/call indicators; not the same view/content as the homepage screenshot.',
  };
}));
const coverage = Object.fromEntries(locales.map(locale => [locale, {
  exactHomepageScreens: locale === 'en' ? slots : [],
  missingExactHomepageScreens: locale === 'en' ? [] : slots,
  guideStoreIllustration: artwork.assets[locale]?.src ?? null,
  note: locale === 'en' ? 'Existing original homepage assets.' : 'Do not claim an English image is translated. Store illustrations are not equivalent raw device screenshots.',
}]));
const report = {
  auditedAt: '2026-10-19',
  scope: 'Existing assets only; no app changes, captures, store writes, image editing, or public page changes.',
  locales: locales.length, uniqueHomepageScreenshotSlots: slots.length,
  exactNonEnglishHomepageScreenshotLocales: 0,
  localizedStoreIllustrationLocales: Object.keys(artwork.assets).length,
  suitableForAutomaticRawHomepageReplacement: false,
  coverage, qaCaptures,
  otherQACandidates: [
    'artifacts/production-audit-2026-10-15/android/screenshots/release-portuguese-large-Agenda.png',
    'artifacts/production-audit-2026-10-15/android/screenshots/release-portuguese-large-Planeador.png',
    'artifacts/production-audit-2026-10-15/android/signed-release-final/portuguese-home.png',
  ].map(file => ({file: path.join(appRoot, file), width: 1080, height: 2340, equivalentHomepageScreenshot: false})),
  illustrationProvenance: [
    'release/submission-preparation-2026-10-18/planner-artwork/manifest.json explicitly identifies rendered marketing artwork, not live-account/device captures.',
    'release/ios-localization-expansion/manifest.json identifies the original HTML marketing templates.',
    'app/guides/artwork.json records 43 localized App Store blocker illustrations and their provenance hashes.',
  ],
};
fs.mkdirSync(path.join(root, 'translations'), {recursive: true});
fs.writeFileSync(path.join(root, 'translations/screenshot-audit.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({locales: locales.length, exactNonEnglishHomepageScreenshotLocales: 0, illustrationLocales: Object.keys(artwork.assets).length, qaCaptures: qaCaptures.length}));
