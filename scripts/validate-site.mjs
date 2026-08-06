#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outRoot = join(repoRoot, "out");
const origin = "https://nonlate.app";

const publicPages = new Map([
  ["/", "index.html"],
  ["/privacy/", "privacy/index.html"],
  ["/terms/", "terms/index.html"],
  ["/support/", "support/index.html"],
  ["/data-deletion/", "data-deletion/index.html"],
]);

const callbackNames = [
  "airtable", "asana", "blackboard", "clickup", "github", "google_tasks", "jira", "linear",
  "monday", "notion", "notion_realtime", "slack", "slack_realtime", "ticktick", "todoist",
  "todoist_realtime", "trello",
];

const protectedHashes = {
  "app-ads.txt": "4dd545e4e9d58a9edf2c85eac93fa4c3d51694c6c1a1ed921e2bc61d9ff05dd4",
  ".well-known/apple-app-site-association": "4e10d9982b0dd59363772359aa6b939f0601200de654436507aa7b9788399402",
  ".well-known/assetlinks.json": "7251c274c8461fd16c717f4c957954568055fdd1697207c9139d147099e9f196",
  ".well-known/microsoft-identity-association.json": "bbf91a66e5bde422aff695cc3272a031c834fc391b53de76e13132c1807e0d76",
  "deadline/oauth/callback/airtable/index.html": "99e5eaab24881b3b7bad28f5fd242ed3a58dee65b30b5974c2a5556079f01889",
  "deadline/oauth/callback/asana/index.html": "71ee50632a5095dd88a06035ed7c13a9aefb27777ae9331d181b5e756a08107f",
  "deadline/oauth/callback/blackboard/index.html": "2f7aac19c951a89c1b895518b048a3bdee256e3a6039658c86822d46e2baff0f",
  "deadline/oauth/callback/clickup/index.html": "c99b58e64f243d63a388d713ff0262c09dd938cf9110e861dfcb6443e867d8a7",
  "deadline/oauth/callback/github/index.html": "cde92950829b630e2a66ca5816870f384b148276644f858d6139d1a2ccbd1b1a",
  "deadline/oauth/callback/google_tasks/index.html": "b3055d3685dd7780992f9d81c96debac22485c596ae919018c283302176eca2c",
  "deadline/oauth/callback/jira/index.html": "acc6c2371434083f4a704d3cc5717416c03faffc7f6c3b82188aaa9e69f2d0a5",
  "deadline/oauth/callback/linear/index.html": "df4a4e1e744c80312bafbf3d7011f50ed7d3e0d69093fb430df9ec21557facc2",
  "deadline/oauth/callback/monday/index.html": "624c05aa65875456c7a7d83b15204e11f993b0697cb56114b735e8d3dd63fbf7",
  "deadline/oauth/callback/notion/index.html": "d6f81a693dd6b85ce4e908d84e82f9a97244044210e23ce4a5dea9ba59261b95",
  "deadline/oauth/callback/notion_realtime/index.html": "d83f9c6e2d947f38ec3ee0948467285ef170e9985315be575a76a222199fd447",
  "deadline/oauth/callback/oauth-ui.js": "57bcbc562c780e3f588e04330ce8e71e8b41ec21c3ef42be9888bda5e6e4b69f",
  "deadline/oauth/callback/slack/index.html": "2b58e0c6668d043c6a887ac2839a93fc29c8068f928ee761aba08657610428c3",
  "deadline/oauth/callback/slack_realtime/index.html": "2d1b032fc53d8783ea46a76255b9eb59752b41f1dc401ddea5a0ff185e5ce08e",
  "deadline/oauth/callback/ticktick/index.html": "238bd0feb41d7bd84004d570d1d8978508b684ec1ea2aace1237d0edd96d5a15",
  "deadline/oauth/callback/todoist/index.html": "493845f770777c910f630ca18d8bbbac827078e3d49d1ff8957602a34ad1ebc3",
  "deadline/oauth/callback/todoist_realtime/index.html": "857b0a2766f159d7e2aad78061c76bf5ad2a0e2369c82db634f447ad7dc433bf",
  "deadline/oauth/callback/trello/index.html": "8b22a1c55c8e85aab36e4e1552b988dd9a7c64631e0d4cc15efd3261f2adc90b",
};

let passed = 0;
const failures = [];

function check(label, validator) {
  try {
    validator();
    passed += 1;
    console.log(`✓ ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ label, message });
    console.error(`✗ ${label}\n  ${message.replaceAll("\n", "\n  ")}`);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function read(pathname) {
  return readFileSync(join(outRoot, pathname), "utf8");
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const pathname = join(directory, entry.name);
    return entry.isDirectory() ? walk(pathname) : entry.isFile() ? [pathname] : [];
  });
}

function hash(pathname) {
  return createHash("sha256").update(readFileSync(pathname)).digest("hex");
}

function decodeEntities(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"', rsquo: "’" };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    const lower = code.toLowerCase();
    if (lower.startsWith("#x")) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
    if (lower.startsWith("#")) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
    return named[lower] ?? entity;
  });
}

function visibleText(html) {
  return decodeEntities(html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ").trim();
}

function metaContent(html, key, attribute = "name") {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${key}["'])[^>]*\\bcontent=["']([^"']*)["'][^>]*>`, "i");
  const reverse = new RegExp(`<meta\\b(?=[^>]*\\bcontent=["']([^"']*)["'])[^>]*\\b${attribute}=["']${key}["'][^>]*>`, "i");
  return decodeEntities(html.match(pattern)?.[1] ?? html.match(reverse)?.[1] ?? "");
}

function canonical(html) {
  return html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1]
    ?? html.match(/<link\b(?=[^>]*\bhref=["']([^"']+)["'])[^>]*\brel=["']canonical["'][^>]*>/i)?.[1]
    ?? "";
}

function fileOrIndexExists(pathname) {
  if (!existsSync(pathname)) return false;
  const stats = statSync(pathname);
  return stats.isFile() || (stats.isDirectory() && existsSync(join(pathname, "index.html")));
}

function resolveReference(reference) {
  if (reference.startsWith("#") || reference.startsWith("mailto:") || reference.startsWith("tel:")) return null;
  let url;
  try {
    url = new URL(reference, `${origin}/`);
  } catch {
    return null;
  }
  if (url.origin !== origin) return null;
  const resolved = resolve(outRoot, `.${decodeURIComponent(url.pathname)}`);
  expect(resolved === outRoot || resolved.startsWith(`${outRoot}${sep}`), `reference escapes output: ${reference}`);
  return resolved;
}

console.log("Nonlate GitHub Pages validation\n");

check("static export contains every public route and platform file", () => {
  const required = [
    "index.html", "404.html", "privacy/index.html", "terms/index.html", "support/index.html",
    "data-deletion/index.html", "CNAME", ".nojekyll", "robots.txt", "sitemap.xml", "site.webmanifest",
    "app-ads.txt", ".well-known/apple-app-site-association", ".well-known/assetlinks.json",
    ".well-known/microsoft-identity-association.json", "assets/screens/ios-blocker.png",
    "assets/screens/android-blocker.png", "og.png",
  ];
  const missing = required.filter((pathname) => !existsSync(join(outRoot, pathname)));
  expect(missing.length === 0, `missing:\n- ${missing.join("\n- ")}`);
  expect(read("CNAME").trim() === "nonlate.app", "CNAME must contain nonlate.app");
});

check("Pages artifact packaging includes hidden platform-association files", () => {
  const workflow = readFileSync(join(repoRoot, ".github/workflows/deploy-pages.yml"), "utf8");
  expect(/include-hidden-files:\s*true/.test(workflow), "Pages upload must include .well-known and .nojekyll");
});

for (const [route, pathname] of publicPages) {
  check(`metadata, canonical URL, and landmarks: ${route}`, () => {
    const html = read(pathname);
    expect(/<title>[^<]+<\/title>/i.test(html), "missing title");
    expect(metaContent(html, "description"), "missing description");
    expect(canonical(html) === `${origin}${route}`, `canonical must be ${origin}${route}; found ${canonical(html)}`);
    expect(/<main\b[^>]*\bid=["']main-content["']/i.test(html), "missing main#main-content");
    expect(/<a\b[^>]*class=["'][^"']*skip-link[^"']*["'][^>]*href=["']#main-content["']/i.test(html)
      || /<a\b[^>]*href=["']#main-content["'][^>]*class=["'][^"']*skip-link/i.test(html), "missing skip link");
  });
}

check("homepage preserves the complete dual-platform blocker story", () => {
  const html = read("index.html");
  const text = visibleText(html);
  const required = [
    "Know what’s due before you scroll.", "Actual current iOS blocker capture", "Actual current Android blocker capture",
    "Work is due", "You open a distraction", "Nonlate checks", "Blocker appears", "The blocker is the product.",
    "Focus Lock", "Stronger break control", "12 built-in themes",
    "+8 more themes", "Custom colors too", "Coming soon to iOS and Android",
  ];
  const missing = required.filter((value) => !text.includes(value));
  expect(missing.length === 0, `missing copy: ${missing.join(", ")}`);
  for (const forbidden of ["Reminder only", "Pause blocking", "Return with intention", "View the plan"]) {
    expect(!text.includes(forbidden), `found superseded copy: ${forbidden}`);
  }
  const source = readFileSync(join(repoRoot, "app/page.tsx"), "utf8");
  expect(source.includes("View tasks") && source.includes("Start a 10-minute break"), "intercept actions changed");
  for (const id of ["moment", "product", "tasks", "integrations", "plans", "privacy", "faq", "coming-soon"]) {
    expect(new RegExp(`\\bid=["']${id}["']`).test(html), `missing #${id}`);
  }
});

check("homepage ships SoftwareApplication and FAQ structured data", () => {
  const html = read("index.html");
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  expect(scripts.length === 1, `expected one JSON-LD block; found ${scripts.length}`);
  const data = JSON.parse(scripts[0][1]);
  const graph = data["@graph"] ?? [];
  expect(graph.some((entry) => entry["@type"] === "SoftwareApplication"), "missing SoftwareApplication");
  const faq = graph.find((entry) => entry["@type"] === "FAQPage");
  expect(faq?.mainEntity?.length === 6, "FAQPage must expose all six questions");
});

check("legal and support pages contain the production source-of-truth copy", () => {
  const privacy = visibleText(read("privacy/index.html"));
  for (const expected of [
    "Last updated: July 22, 2026", "Birth month and year stored on your device", "Advertising and privacy choices",
    "Paid users, users whose age is unknown, and users identified as under 16 do not receive ads",
    "Google user data imported through connected Google services is never used for advertising",
    "AES-256-GCM", "support@nonlate.app",
  ]) expect(privacy.includes(expected), `privacy page is missing: ${expected}`);

  expect(visibleText(read("terms/index.html")).includes("Last updated: April 2, 2026"), "terms update date changed");
  expect(visibleText(read("support/index.html")).includes("Ad privacy choices"), "support ad-privacy request is missing");
  expect(visibleText(read("data-deletion/index.html")).includes("Nonlate Data Deletion Request"), "deletion subject is missing");
});

check("OAuth callbacks and association files are byte-for-byte production baselines", () => {
  for (const [pathname, expected] of Object.entries(protectedHashes)) {
    for (const root of [join(repoRoot, "public"), outRoot]) {
      const fullPath = join(root, pathname);
      expect(existsSync(fullPath), `missing ${relative(repoRoot, fullPath)}`);
      expect(hash(fullPath) === expected, `${relative(repoRoot, fullPath)} changed unexpectedly`);
    }
  }
  const callbackRoot = join(outRoot, "deadline/oauth/callback");
  const actual = readdirSync(callbackRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(callbackRoot, entry.name, "index.html")))
    .map((entry) => entry.name).sort();
  expect(JSON.stringify(actual) === JSON.stringify([...callbackNames].sort()), `callback route set changed: ${actual.join(", ")}`);
});

check("Digital Asset Links contains only the approved production fingerprint", () => {
  const fingerprint = "4A:D6:CA:B6:08:AE:DC:4A:B0:82:46:03:B8:93:B3:29:A4:CC:04:D8:3A:B1:10:BE:EA:56:68:85:1F:F4:FC:E8";
  const statements = JSON.parse(read(".well-known/assetlinks.json"));
  for (const packageName of ["com.deadline", "com.nonlate.app"]) {
    const statement = statements.find((entry) => entry?.target?.package_name === packageName);
    expect(statement, `missing ${packageName}`);
    expect(JSON.stringify(statement.target.sha256_cert_fingerprints) === JSON.stringify([fingerprint]), `${packageName} fingerprint set changed`);
  }
});

check("reduced motion and no-JavaScript visibility remain accessible", () => {
  const css = walk(outRoot).filter((pathname) => extname(pathname) === ".css").map((pathname) => readFileSync(pathname, "utf8")).join("\n");
  expect(/prefers-reduced-motion:\s*reduce/i.test(css), "missing reduced-motion stylesheet");
  expect(/\[data-reveal\][^{]*\{[^}]*opacity:\s*1/i.test(css), "content is not visible before JavaScript");
  expect(/\.reveal-ready\s+\[data-reveal\]/.test(css), "scroll reveal readiness gate is missing");
});

check("404 page is noindex and contains no OAuth forwarding", () => {
  const html = read("404.html");
  expect(metaContent(html, "robots").includes("noindex"), "404 must be noindex");
  expect(!/deadline:\/\/oauth\/callback/i.test(html), "404 must not forward OAuth callbacks");
});

check("sitemap contains exactly the five public content URLs", () => {
  const actual = [...read("sitemap.xml").matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((match) => match[1]);
  const expected = [...publicPages.keys()].map((route) => `${origin}${route}`);
  expect(JSON.stringify(actual.sort()) === JSON.stringify(expected.sort()), `sitemap URLs changed: ${actual.join(", ")}`);
});

check("all local links and assets in exported HTML resolve", () => {
  const broken = [];
  for (const pathname of walk(outRoot).filter((file) => extname(file) === ".html")) {
    const html = readFileSync(pathname, "utf8");
    for (const tag of html.matchAll(/<(?:a|img|link|script|source)\b[^>]*>/gi)) {
      for (const match of tag[0].matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
        const resolved = resolveReference(decodeEntities(match[1]));
        if (resolved && !fileOrIndexExists(resolved)) broken.push(`${relative(outRoot, pathname)} → ${match[1]}`);
      }
    }
  }
  expect(broken.length === 0, `unresolved references:\n- ${broken.join("\n- ")}`);
});

check("JSON and manifest documents parse and no Google Fonts request ships", () => {
  for (const pathname of walk(outRoot).filter((file) => [".json", ".webmanifest"].includes(extname(file)))) {
    JSON.parse(readFileSync(pathname, "utf8"));
  }
  JSON.parse(read(".well-known/apple-app-site-association"));
  const searchable = walk(outRoot).filter((file) => [".html", ".css"].includes(extname(file))).map((file) => readFileSync(file, "utf8")).join("\n");
  expect(!/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)/i.test(searchable), "runtime Google Fonts request found");
});

console.log(`\n${passed} checks passed; ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
