# Nonlate website

Production source for [nonlate.app](https://nonlate.app/). The site is a static Next.js export deployed by GitHub Actions to GitHub Pages.

## Local development

Requires Node.js 22 or newer.

```bash
npm ci
npm run dev
```

## Validation

```bash
npm run lint
npm test
git diff --check
```

`npm test` creates the static export in `out/`, runs rendered-page tests, and verifies the legal routes, OAuth callbacks, platform-association files, advertising declaration, metadata, links, accessibility fallbacks, and production file hashes.

## Deployment

Pull requests run the validation workflow. Merges to `main` run the GitHub Pages deployment workflow. The custom domain remains `nonlate.app`, with HTTPS enforced in the repository’s Pages settings.

Deployment-critical static files live in `public/`:

- `.well-known/**`
- `deadline/oauth/callback/**`
- `app-ads.txt`
- `CNAME`
- `robots.txt`, `sitemap.xml`, and `site.webmanifest`

The OAuth and association files are protected by checksums in `scripts/validate-site.mjs`; update those checksums only when an app-link or OAuth change has been separately reviewed.

## Complete multilingual release package

All 47 language variants cover the homepage, homepage FAQ, guide index, first
guide, Privacy, Terms, Support and Data deletion. English URLs remain unchanged;
translated policies use `/<locale>/privacy/`, `/<locale>/terms/`,
`/<locale>/support/` and `/<locale>/data-deletion/`. The complete sitemap contains
329 canonical pages. Language selectors retain the current page, and policy links
use full-page navigation because those pages are generated as static HTML.

The four policy/help pages use directly authored, AI-assisted translations with
independent checks of critical clauses and links to the English original. This
is not native-speaker certification or professional legal review. The Terms now
correctly state that manual tasks and core blocking remain free, as explicitly
approved by the user. Other policy meaning, security details and contact addresses
are preserved. Trial, subscription and retention qualifications remain intact.

All seven screenshot roles have matching-language artwork in all 47 variants;
provider icons and service names remain unchanged. Videos are silent visual
demonstrations and remain unchanged. No app binaries or store submissions are
modified by this website release.

`scripts/apply-policy-reviews.mjs` merges reviewed policy units, and
`scripts/approve-website-release.mjs` records the user's explicit publication
approval only for complete, reviewed dictionaries. CI runs normal `npm test`
without draft/preview flags. Policy templates and English source hashes must
remain aligned; source changes require reviewed translation updates.

The notes below record intermediate preparation audits and their then-existing
gaps; the complete release package described above supersedes those old counts.

## Multilingual website preparation history

The language registry in `app/guides/locales.json` contains 47 app-supported language variants. English remains at `/`; translated homepages use `/<locale>/`, guide indexes use `/guides/<locale>/`, and articles retain the same locale. Store links retain the verified app IDs. The app, its existing website links, videos, and animation behavior are not modified by this website work.

Translations are saved locally, not fetched at visitor runtime. No paid translation service is required. Dictionaries marked `draft-machine-assisted` or `draft` are not publication approval. An in-session language review is recorded separately from native-speaker certification and final release approval.

Production export deliberately fails when a homepage dictionary has not been explicitly approved. For local draft QA only:

```bash
node scripts/apply-homepage-reviews.mjs
node scripts/apply-guide-reviews.mjs
NONLATE_TRANSLATION_DRAFT=1 npm test
```

For a small local preview, set `NONLATE_PREVIEW_LOCALES=pt-BR,pt-PT,es,fr,de` when building. Preview-only routes are marked noindex. Do not use draft/preview flags in deployment. The complete route/link test suite expects all 47 languages, not a partial preview export.

`translations/homepage/manual/` stores complete in-session reviews. Reconcile source changes before reapplying indexed reviews; the merge script checks their frozen source hash. `scripts/local-translate-homepage.py` is an optional offline draft generator, not part of the build. Its separately installed model/runtime are outside the repository and are not shipped to visitors. It never calls a translation API.

`translations/guides/reviews.json` records source-by-source guide reviews and targeted corrections for the pinned 111-unit source. The guide review merger can reuse already-reviewed shared homepage wording. Other guide locales may store their completed reviews directly in their dictionaries. Recomposition preserves complete, unchanged reviewed dictionaries; indexed older overrides require source-hash reconciliation rather than silently shifting translations onto different sentences. No in-session review grants release approval or native-speaker certification.

Raw screenshot coverage is recorded in `translations/screenshot-audit.json`. The user selected matching translated store illustrations where available. `app/homepage-artwork.json` records the screen-specific image mapping and provenance: 44 languages have iOS Home, Planner and blocker illustrations; 17 also have a matching Tasks illustration. These complete illustrations are displayed without the raw-capture crop or a duplicated headline. The guides use iOS blocker illustrations in 44 languages, including normalized Urdu (`ur-PK` → `ur`). English homepages are unchanged. Unmatched individual slots retain explicitly labelled English screenshots; another platform's image is never substituted. `scripts/prepare-homepage-artwork.cjs` retrieves existing App Store images read-only and copies already prepared local packages, with no store writes or translation service.

The subsequent read-only Google Play audit found 29 non-English listings with eight distinct phone illustrations each. `translations/android-store-inventory.json` records those UI-observed public image URLs. `scripts/prepare-android-homepage-artwork.mjs` copies the existing blocker (2), Schedule (6), and Insights (8) artwork without image editing. These now replace the corresponding Android slots in those 29 homepage languages, and the guides use their matching Android blocker illustrations. Google Play images have separate localized Google Play labels, never App Store attribution. All 46 translated homepages now have at least one matching localized illustration; unmatched individual slots still retain explicitly labelled English images. Neither store is edited by this workflow.

Release checks still required: review every remaining draft for meaning, especially subscription renewal and free-plan limits; resolve recorded untranslated units; check localized mobile/RTL layouts; and approve screenshot coverage before publishing. Future guides must use the same locale registry, language links, dictionary completeness checks, and image provenance rules.

### October 19 localization completion

The store expansion added 17 iOS listing languages and 16 Google Play languages. The submitted totals are 45 App Store locales (9 iPhone + 9 iPad images each) and 46 Google Play locales (8 phone images each). The website now has matching Android blocker, Schedule and Insights illustrations in 45 non-English languages. `scripts/reuse-store-expansion.cjs` reuses the exact prepared store-image bytes and the 17 corrected iOS Planner illustrations; it does not edit a store.

`scripts/align-website-trial-copy.py` reconciles the 308 homepage units and keyed reviews after removing the incorrect free-calendar promise and obsolete Planner plus-button instruction. Trial-expiry wording is stored in `translations/trial-expiry.json`. No app binaries, videos, OAuth routes or association files are changed by this website correction. Final local QA passed 32 tests, 157 site checks, and 94 mobile-page checks. Production publication and explicit final website release approval are still pending; do not deploy using the draft flag.

Known gaps are explicit: iOS has 47 bundled translation variants but only 30 named manual language choices; Android tablet screenshots remain English/default; exact iOS Tasks illustrations are available in only 17 non-English website languages. Store-unavailable languages use labeled English fallback images on the relevant platform. In-session translation review is not native-speaker certification, and older app wording still needs a linguistic pass.
# Website screenshot translation completion — October 19, 2026

The remaining homepage image fallbacks are now filled with offline-rendered,
editable website illustrations. All 47 language variants have all seven image
roles: iOS Home/Tasks/Planner/Blocker and Android Blocker/Schedule/Insights.
English originals, videos, animation behavior, app binaries and store submissions
were not changed. The guides use the same localized blocker images.

55 website illustrations were generated: Tasks for all 46 non-English languages
(also correcting 17 mislabeled Schedule sources), iOS Home/Planner/Blocker for
Persian and Filipino, and the three Android roles for Odia. Icons use original
bytes; service names including Canvas, Notion, Slack and Google Tasks are retained.
Website-only images have explicit provenance and are not attributed to the stores.
The 30-cell Insights graphic is materialized from its original design template.

Reproduction: `python3 scripts/complete-website-artwork.py`, then
`node scripts/render-website-artwork.cjs`. Translation and render audit files are
under `translations/website-artwork/`. No translation API or paid service is used.
This does not translate the separate legal/support pages and does not publish the
site or bypass its existing translation approval gate.
