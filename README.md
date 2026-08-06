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
