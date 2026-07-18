#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { Script, createContext } from 'node:vm';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteOrigin = 'https://nonlate.app';
const exactFingerprint = '4A:D6:CA:B6:08:AE:DC:4A:B0:82:46:03:B8:93:B3:29:A4:CC:04:D8:3A:B1:10:BE:EA:56:68:85:1F:F4:FC:E8';

const publicPages = new Map([
  ['/', 'index.html'],
  ['/privacy/', 'privacy/index.html'],
  ['/terms/', 'terms/index.html'],
  ['/support/', 'support/index.html'],
  ['/data-deletion/', 'data-deletion/index.html'],
]);

const callbackNames = [
  'airtable',
  'asana',
  'blackboard',
  'clickup',
  'github',
  'google_tasks',
  'jira',
  'linear',
  'monday',
  'notion',
  'notion_realtime',
  'slack',
  'slack_realtime',
  'ticktick',
  'todoist',
  'todoist_realtime',
  'trello',
];

const requiredFiles = [
  '.nojekyll',
  '.well-known/apple-app-site-association',
  '.well-known/assetlinks.json',
  '.well-known/microsoft-identity-association.json',
  '.github/workflows/validate-site.yml',
  '404.html',
  'CNAME',
  'assets/brand/apple-touch-icon.png',
  'assets/brand/favicon-32.png',
  'assets/brand/favicon.ico',
  'assets/brand/icon-192.png',
  'assets/brand/icon-512.png',
  'index.html',
  'privacy/index.html',
  'terms/index.html',
  'support/index.html',
  'data-deletion/index.html',
  'robots.txt',
  'script.js',
  'site.webmanifest',
  'sitemap.xml',
  'styles.css',
];

const homepageIds = [
  'nonlate-moment',
  'product',
  'modes',
  'integrations',
  'insights',
  'plans',
  'privacy',
  'faq',
  'coming-soon',
];

let passed = 0;
const failures = [];

function check(label, validator) {
  try {
    validator();
    passed += 1;
    process.stdout.write(`\u2713 ${label}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ label, message });
    process.stdout.write(`\u2717 ${label}\n  ${message.replaceAll('\n', '\n  ')}\n`);
  }
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function fromRoot(pathname) {
  return join(siteRoot, pathname);
}

function read(pathname) {
  return readFileSync(fromRoot(pathname), 'utf8');
}

function normalizedRelative(pathname) {
  return relative(siteRoot, pathname).split(sep).join('/');
}

function walk(directory) {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

function parseAttributes(tag) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = pattern.exec(tag)) !== null) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((match) => ({
    source: match[0],
    attributes: parseAttributes(match[0]),
  }));
}

function decodeEntities(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    hellip: '\u2026',
    lt: '<',
    nbsp: ' ',
    quot: '"',
    rsquo: '\u2019',
  };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    const lower = code.toLowerCase();
    if (lower.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    }
    if (lower.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    }
    return named[lower] ?? entity;
  });
}

function visibleText(html) {
  return decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
  ).replace(/\s+/g, ' ').trim();
}

function callbackScripts(pathname) {
  return [...read(pathname).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !parseAttributes(`<script ${match[1]}>`).has('src'))
    .map((match) => match[2]);
}

function executeCallback(pathname, { search = '', hash = '', readyState = 'complete' } = {}) {
  const nodes = {
    'manual-link': { style: { display: 'none' } },
    link: { href: '#' },
  };
  const scheduled = [];
  const location = { search, hash, href: `https://nonlate.app/${pathname}` };
  const document = {
    readyState,
    getElementById(id) {
      return nodes[id] ?? null;
    },
    addEventListener(type, callback) {
      if (type === 'DOMContentLoaded') {
        scheduled.push({ callback, delay: 0, event: type });
      }
    },
  };
  const context = createContext({
    URLSearchParams,
    document,
    window: { location },
    setTimeout(callback, delay = 0) {
      scheduled.push({ callback, delay });
      return scheduled.length;
    },
  });

  callbackScripts(pathname).forEach((source, index) => {
    new Script(source, { filename: `${pathname}#callback-${index + 1}` }).runInContext(context);
  });

  return { context, document, location, nodes, scheduled };
}

function metaContent(html, selectorName) {
  const meta = tags(html, 'meta').find(({ attributes }) =>
    attributes.get('name')?.toLowerCase() === selectorName.toLowerCase(),
  );
  return meta?.attributes.get('content')?.trim() ?? '';
}

function canonicalHref(html) {
  const canonical = tags(html, 'link').find(({ attributes }) =>
    attributes.get('rel')?.toLowerCase().split(/\s+/).includes('canonical'),
  );
  return canonical?.attributes.get('href')?.trim() ?? '';
}

function getTitle(html) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? visibleText(match[1]) : '';
}

function fileOrDirectoryIndexExists(pathname) {
  if (!existsSync(pathname)) {
    return false;
  }
  const stats = statSync(pathname);
  return stats.isFile() || (stats.isDirectory() && existsSync(join(pathname, 'index.html')));
}

function resolveSiteReference(rawReference) {
  const decoded = decodeEntities(rawReference.trim());
  let pathname;

  if (decoded.startsWith('/') && !decoded.startsWith('//')) {
    pathname = decoded.split(/[?#]/, 1)[0];
  } else {
    let parsed;
    try {
      parsed = new URL(decoded);
    } catch {
      return null;
    }
    if (parsed.origin !== siteOrigin) {
      return null;
    }
    pathname = parsed.pathname;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    throw new Error(`invalid URL encoding in reference ${JSON.stringify(rawReference)}`);
  }

  const resolved = resolve(siteRoot, `.${decodedPath}`);
  expect(
    resolved === siteRoot || resolved.startsWith(`${siteRoot}${sep}`),
    `reference escapes the site root: ${JSON.stringify(rawReference)}`,
  );
  return resolved;
}

function validatePublicPage(route, pathname) {
  const html = read(pathname);
  const expectedCanonical = `${siteOrigin}${route}`;
  expect(getTitle(html), 'missing a non-empty <title>');
  expect(metaContent(html, 'description'), 'missing a non-empty meta description');
  expect(
    canonicalHref(html) === expectedCanonical,
    `canonical must be ${expectedCanonical}; found ${canonicalHref(html) || 'none'}`,
  );
  expect(/<main\b[^>]*>/i.test(html), 'missing a <main> landmark');
  expect(/<main\b[^>]*\bid=(['"])main-content\1/i.test(html), 'main landmark must have id="main-content"');

  const skipLink = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].find((match) => {
    const openingTag = match[0].match(/^<a\b[^>]*>/i)?.[0] ?? '';
    const attributes = parseAttributes(openingTag);
    const classes = attributes.get('class')?.split(/\s+/) ?? [];
    return classes.includes('skip-link');
  });
  expect(skipLink, 'missing an anchor with class="skip-link"');
  const skipAttributes = parseAttributes(skipLink[0].match(/^<a\b[^>]*>/i)[0]);
  expect(skipAttributes.get('href') === '#main-content', 'skip link must target #main-content');
}

process.stdout.write(`Nonlate site validation\nRoot: ${siteRoot}\n\n`);

check('required files and public routes exist', () => {
  const missing = requiredFiles.filter((pathname) => !existsSync(fromRoot(pathname)));
  expect(missing.length === 0, `missing:\n- ${missing.join('\n- ')}`);
  expect(read('CNAME').trim() === 'nonlate.app', 'CNAME must contain exactly nonlate.app');
});

check('the callback route set is exactly the 17 supported providers', () => {
  const callbackRoot = fromRoot('deadline/oauth/callback');
  expect(existsSync(callbackRoot), 'missing deadline/oauth/callback');
  const actual = readdirSync(callbackRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(callbackRoot, entry.name, 'index.html')))
    .map((entry) => entry.name)
    .sort();
  const expected = [...callbackNames].sort();
  expect(
    JSON.stringify(actual) === JSON.stringify(expected),
    `expected ${expected.join(', ')}; found ${actual.join(', ')}`,
  );
});

for (const [route, pathname] of publicPages) {
  check(`public page metadata and landmarks: ${route}`, () => validatePublicPage(route, pathname));
}

check('homepage contains the required section IDs and hero destination', () => {
  const html = read('index.html');
  const foundIds = new Set(
    [...html.matchAll(/\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)].map((match) => match[1] ?? match[2] ?? match[3]),
  );
  const missing = homepageIds.filter((id) => !foundIds.has(id));
  expect(missing.length === 0, `missing IDs: ${missing.map((id) => `#${id}`).join(', ')}`);
  const momentLinks = tags(html, 'a').filter(({ attributes }) => attributes.get('href') === '#nonlate-moment');
  expect(momentLinks.length > 0, 'hero needs an anchor whose href is #nonlate-moment');
});

check('homepage contains no superseded product claims', () => {
  const text = visibleText(read('index.html'));
  const staleClaims = [
    ['unqualified real-time sync', /\breal[ -]?time sync\b/i],
    ['unlimited sources or integrations', /\bunlimited (?:sources?|integrations?)\b/i],
    ['all prompts being skippable', /\b(?:every|all) (?:nudge|prompt|interruption)s? (?:is|are|being) skippable\b/i],
    ['certificate pinning', /\bcertificate[ -]?pinn(?:ed|ing)\b/i],
    ['universal instant updates', /\bthe moment (?:anything|something) changes,? Nonlate knows\b/i],
    ['identical platform behavior', /\b(?:identical|exactly the same|works? the same)\b.{0,50}\b(?:iOS|Android)\b/i],
  ];
  const found = staleClaims.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  expect(found.length === 0, `found stale claims: ${found.join(', ')}`);
});

check('homepage has no mailto early-access or waitlist CTA', () => {
  const html = read('index.html');
  const problematic = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)]
    .map((match) => match[0])
    .filter((anchor) => {
      const openingTag = anchor.match(/^<a\b[^>]*>/i)?.[0] ?? '';
      const href = parseAttributes(openingTag).get('href') ?? '';
      if (!href.toLowerCase().startsWith('mailto:')) {
        return false;
      }
      return /early(?:%20|\+|\s|-)?access|waitlist|notify(?:%20|\+|\s|-)?me|launch(?:%20|\+|\s|-)?list/i.test(`${href} ${visibleText(anchor)}`);
    });
  expect(problematic.length === 0, 'replace the mailto early-access/waitlist CTA with a non-collecting coming-soon state');
});

check('homepage core story remains available without JavaScript', () => {
  const html = read('index.html');
  const text = visibleText(html);
  const requiredCopy = [
    'Know what\u2019s due before you scroll.',
    'Deadlines connect',
    'What matters rises',
    'You choose the interruption',
    'Nonlate puts the work first',
    'Reminder',
    'Blocker',
    'Focus Lock',
    '20+ supported sources',
    'Live Activities',
    'Coming soon to iOS and Android',
  ];
  const missing = requiredCopy.filter((copy) => !text.includes(copy));
  expect(missing.length === 0, `static HTML is missing: ${missing.join(', ')}`);
  expect(!/<(?:main|section)\b[^>]*\bhidden\b/i.test(html), 'core content must not use the hidden attribute');

  const css = read('styles.css');
  expect(!/^\.reveal\s*\{[^}]*opacity\s*:\s*0/m.test(css), 'reveal content is hidden before JavaScript runs');
  expect(/\.moment__screen:first-child\s*\{[^}]*display\s*:\s*block/s.test(css), 'the first product-sequence screen must be visible without JavaScript');
  expect(/\.js-ready\s+\.site-nav/s.test(css), 'mobile menu collapsing must be gated behind the JavaScript-ready class');
});

check('interactive product sequence exposes only the active screen', () => {
  const html = read('index.html');
  const script = read('script.js');
  const visualTag = html.match(/<div\b[^>]*class=(['"])[^'"]*\bmoment__visual\b[^'"]*\1[^>]*>/i)?.[0] ?? '';
  expect(!/\baria-live\s*=/i.test(visualTag), 'the full visual region must not announce every stacked screenshot');

  const captionTag = html.match(/<div\b[^>]*class=(['"])[^'"]*\bmoment__caption\b[^'"]*\1[^>]*>/i)?.[0] ?? '';
  expect(/\baria-live\s*=\s*(['"])polite\1/i.test(captionTag), 'the changing caption must use aria-live="polite"');
  expect(/\baria-atomic\s*=\s*(['"])true\1/i.test(captionTag), 'the changing caption must be announced atomically');

  const screenTags = tags(html, 'img').filter(({ attributes }) =>
    attributes.get('class')?.split(/\s+/).includes('moment__screen'),
  );
  expect(screenTags.length === 4, `expected four product-sequence screens; found ${screenTags.length}`);
  const initiallyHidden = screenTags.slice(1).filter(({ attributes }) => attributes.get('aria-hidden') === 'true');
  expect(initiallyHidden.length === 3, 'the three inactive static screens must start aria-hidden');
  expect(/screen\.setAttribute\(['"]aria-hidden['"],\s*String\(screenIndex\s*!==\s*index\)\)/.test(script), 'JavaScript must synchronize aria-hidden with the active screen');
});

check('Pages validation workflow runs the site validator', () => {
  const workflow = read('.github/workflows/validate-site.yml');
  expect(/pull_request\s*:/i.test(workflow), 'workflow must validate pull requests');
  expect(/push\s*:/i.test(workflow), 'workflow must validate pushes');
  expect(/node\s+scripts\/validate-site\.mjs/.test(workflow), 'workflow must run node scripts/validate-site.mjs');
});

check('reduced-motion users receive static visible states', () => {
  const css = read('styles.css');
  const script = read('script.js');
  expect(/@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(css), 'missing reduced-motion media query');
  expect(/\.will-reveal\s*\{[^}]*opacity\s*:\s*1[^}]*transform\s*:\s*none/s.test(css), 'reduced-motion reveal state must remain visible and untransformed');
  expect(/matchMedia\(['"]\(prefers-reduced-motion:\s*reduce\)['"]\)/.test(script), 'JavaScript must read the reduced-motion preference');
  expect(/!reduceMotion\.matches\s*&&\s*['"]IntersectionObserver['"]\s+in\s+window/.test(script), 'scroll observers must be skipped for reduced-motion users');
});

for (const callbackName of callbackNames) {
  check(`callback security metadata: ${callbackName}`, () => {
    const pathname = `deadline/oauth/callback/${callbackName}/index.html`;
    const html = read(pathname);
    const cspMeta = tags(html, 'meta').find(({ attributes }) =>
      attributes.get('http-equiv')?.toLowerCase() === 'content-security-policy',
    );
    expect(cspMeta, 'missing Content-Security-Policy meta tag');
    const csp = cspMeta.attributes.get('content') ?? '';
    const requiredDirectives = [
      "default-src 'none'",
      "script-src 'unsafe-inline'",
      "style-src 'unsafe-inline'",
      "connect-src 'self'",
      "img-src 'self' data:",
      "base-uri 'none'",
      "form-action 'none'",
    ];
    const missingDirectives = requiredDirectives.filter((directive) => !csp.toLowerCase().includes(directive));
    expect(missingDirectives.length === 0, `CSP is missing: ${missingDirectives.join(', ')}`);
    expect(metaContent(html, 'referrer').toLowerCase() === 'no-referrer', 'referrer policy must be no-referrer');
    const robots = metaContent(html, 'robots').toLowerCase().split(/[\s,]+/).filter(Boolean);
    const missingRobots = ['noindex', 'nofollow', 'noarchive'].filter((directive) => !robots.includes(directive));
    expect(missingRobots.length === 0, `robots meta is missing: ${missingRobots.join(', ')}`);
  });
}

check('Blackboard callback preserves query-string passthrough', () => {
  const result = executeCallback('deadline/oauth/callback/blackboard/index.html', {
    search: '?code=abc123&state=safe-state',
  });
  const expected = 'deadline://oauth/callback/blackboard?code=abc123&state=safe-state';
  expect(result.location.href === expected, `automatic redirect must be ${expected}; found ${result.location.href}`);
  expect(result.nodes.link.href === expected, `manual link must be ${expected}; found ${result.nodes.link.href}`);
});

check('Trello callback preserves query and fragment merging', () => {
  const result = executeCallback('deadline/oauth/callback/trello/index.html', {
    search: '?token=query-token&state=safe-state',
    hash: '#token=fragment-token&scope=read%20write',
  });
  const expected = 'deadline://oauth/callback/trello?token=fragment-token&state=safe-state&scope=read+write';
  expect(result.location.href === expected, `automatic redirect must merge the fragment; found ${result.location.href}`);
  expect(result.nodes.link.href === expected, `manual link must preserve the merged callback; found ${result.nodes.link.href}`);
});

check('Notion realtime callback preserves redirect retries', () => {
  const result = executeCallback('deadline/oauth/callback/notion_realtime/index.html', {
    search: '?code=live-code&state=safe-state',
  });
  const retryDelays = result.scheduled
    .filter(({ callback }) => callback.name === 'openDeadLine')
    .map(({ delay }) => delay);
  expect(
    JSON.stringify(retryDelays) === JSON.stringify([0, 700, 1500, 2800]),
    `expected retry delays 0,700,1500,2800; found ${retryDelays.join(',')}`,
  );
  result.scheduled.sort((left, right) => left.delay - right.delay).forEach(({ callback }) => callback());
  const expected = 'deadline://oauth/callback/notion_realtime?code=live-code&state=safe-state';
  expect(result.location.href === expected, `retry redirect must be ${expected}; found ${result.location.href}`);
  expect(result.nodes.link.href === expected, `manual link must be ${expected}; found ${result.nodes.link.href}`);
  expect(result.nodes['manual-link'].style.display === 'block', 'manual link must appear after the retry fallback delay');
});

check('404 page is noindex and cannot forward OAuth callbacks', () => {
  const html = read('404.html');
  const robots = metaContent(html, 'robots').toLowerCase().split(/[\s,]+/).filter(Boolean);
  expect(robots.includes('noindex'), '404 robots meta must contain noindex');
  expect(!/deadline:\/\/oauth\/callback/i.test(html), '404 must not forward to a wildcard OAuth app route');
});

check('JSON, association, manifest, and JSON-LD documents parse', () => {
  const parseTargets = walk(siteRoot)
    .filter((pathname) => ['.json', '.webmanifest'].includes(extname(pathname).toLowerCase()))
    .map(normalizedRelative);
  parseTargets.push('.well-known/apple-app-site-association');
  const errors = [];
  for (const pathname of [...new Set(parseTargets)].sort()) {
    try {
      JSON.parse(read(pathname));
    } catch (error) {
      errors.push(`${pathname}: ${error.message}`);
    }
  }
  for (const [route, pathname] of publicPages) {
    const html = read(pathname);
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    for (const [, rawAttributes, source] of scripts) {
      const attributes = parseAttributes(`<script ${rawAttributes}>`);
      if (attributes.get('type')?.toLowerCase() !== 'application/ld+json') {
        continue;
      }
      try {
        JSON.parse(source);
      } catch (error) {
        errors.push(`${route} JSON-LD: ${error.message}`);
      }
    }
  }
  expect(errors.length === 0, errors.join('\n'));
});

check('Digital Asset Links contains both packages and the release fingerprint', () => {
  const statements = JSON.parse(read('.well-known/assetlinks.json'));
  expect(Array.isArray(statements), 'assetlinks.json must contain a JSON array');
  for (const packageName of ['com.deadline', 'com.nonlate.app']) {
    const statement = statements.find((candidate) => candidate?.target?.package_name === packageName);
    expect(statement, `missing Android package ${packageName}`);
    expect(statement.target.namespace === 'android_app', `${packageName} namespace must be android_app`);
    expect(
      statement.relation?.includes('delegate_permission/common.handle_all_urls'),
      `${packageName} is missing the handle_all_urls relation`,
    );
    const fingerprints = statement.target.sha256_cert_fingerprints;
    expect(Array.isArray(fingerprints), `${packageName} fingerprints must be an array`);
    expect(fingerprints.includes(exactFingerprint), `${packageName} is missing ${exactFingerprint}`);
    expect(
      fingerprints.every((fingerprint) => /^(?:[\dA-F]{2}:){31}[\dA-F]{2}$/.test(fingerprint)),
      `${packageName} contains a malformed or non-colon-delimited fingerprint`,
    );
  }
});

check('sitemap contains exactly the five public content URLs', () => {
  const sitemap = read('sitemap.xml');
  const actual = [...sitemap.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => decodeEntities(match[1]));
  const expected = [...publicPages.keys()].map((route) => `${siteOrigin}${route}`);
  expect(actual.length === expected.length, `expected ${expected.length} URLs; found ${actual.length}`);
  expect(new Set(actual).size === actual.length, 'sitemap contains duplicate URLs');
  const missing = expected.filter((url) => !actual.includes(url));
  const unexpected = actual.filter((url) => !expected.includes(url));
  expect(missing.length === 0 && unexpected.length === 0, `missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}`);
});

check('robots.txt references the canonical sitemap', () => {
  expect(
    /^\s*Sitemap:\s*https:\/\/nonlate\.app\/sitemap\.xml\s*$/im.test(read('robots.txt')),
    'robots.txt must contain Sitemap: https://nonlate.app/sitemap.xml',
  );
});

check('all root-relative and same-origin href/src references resolve', () => {
  const htmlFiles = walk(siteRoot).filter((pathname) => extname(pathname).toLowerCase() === '.html');
  const broken = [];
  for (const pathname of htmlFiles) {
    const html = readFileSync(pathname, 'utf8');
    for (const tag of html.matchAll(/<(?:a|img|link|script|source)\b[^>]*>/gi)) {
      const attributes = parseAttributes(tag[0]);
      for (const attributeName of ['href', 'src']) {
        const reference = attributes.get(attributeName);
        if (!reference) {
          continue;
        }
        let resolved;
        try {
          resolved = resolveSiteReference(reference);
        } catch (error) {
          broken.push(`${normalizedRelative(pathname)}: ${attributeName}=${JSON.stringify(reference)} (${error.message})`);
          continue;
        }
        if (resolved && !fileOrDirectoryIndexExists(resolved)) {
          broken.push(`${normalizedRelative(pathname)}: ${attributeName}=${JSON.stringify(reference)}`);
        }
      }
    }
  }

  const manifest = JSON.parse(read('site.webmanifest'));
  for (const icon of manifest.icons ?? []) {
    if (!icon?.src) {
      continue;
    }
    const resolved = resolveSiteReference(icon.src);
    if (resolved && !fileOrDirectoryIndexExists(resolved)) {
      broken.push(`site.webmanifest: src=${JSON.stringify(icon.src)}`);
    }
  }
  expect(broken.length === 0, `unresolved references:\n- ${broken.join('\n- ')}`);
});

check('site makes no external Google Fonts request', () => {
  const searchable = walk(siteRoot).filter((pathname) => ['.css', '.html'].includes(extname(pathname).toLowerCase()));
  const offenders = searchable
    .filter((pathname) => /(?:fonts\.googleapis\.com|fonts\.gstatic\.com)/i.test(readFileSync(pathname, 'utf8')))
    .map(normalizedRelative);
  expect(offenders.length === 0, `Google Fonts domains found in: ${offenders.join(', ')}`);
});

check('external and inline JavaScript has valid syntax', () => {
  const errors = [];
  const javascriptFiles = walk(siteRoot).filter((pathname) => ['.js', '.mjs'].includes(extname(pathname).toLowerCase()));
  for (const pathname of javascriptFiles) {
    const result = spawnSync(process.execPath, ['--check', pathname], { encoding: 'utf8' });
    if (result.status !== 0) {
      errors.push(`${normalizedRelative(pathname)}:\n${(result.stderr || result.stdout).trim()}`);
    }
  }

  const htmlFiles = walk(siteRoot).filter((pathname) => extname(pathname).toLowerCase() === '.html');
  for (const pathname of htmlFiles) {
    const html = readFileSync(pathname, 'utf8');
    let inlineIndex = 0;
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attributes = parseAttributes(`<script ${match[1]}>`);
      if (attributes.has('src') || attributes.get('type')?.toLowerCase() === 'application/ld+json') {
        continue;
      }
      inlineIndex += 1;
      try {
        new Script(match[2], { filename: `${normalizedRelative(pathname)}#inline-${inlineIndex}` });
      } catch (error) {
        errors.push(error.message);
      }
    }
  }
  expect(errors.length === 0, errors.join('\n'));
});

process.stdout.write('\n');
if (failures.length > 0) {
  process.stdout.write(`Validation failed: ${failures.length} check${failures.length === 1 ? '' : 's'} failed; ${passed} passed.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Validation passed: ${passed} checks.\n`);
}
