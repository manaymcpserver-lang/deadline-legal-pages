import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const out = new URL("../out/", import.meta.url);

const readPage = (pathname) => readFile(new URL(pathname, out), "utf8");

test("static export contains the production landing experience", async () => {
  const html = await readPage("index.html");
  assert.match(html, /Know what’s due before you scroll\./i);
  assert.match(html, /Replay the intercept demo/i);
  assert.match(html, /Actual Nonlate iOS blocker screen/i);
  assert.match(html, /Actual Nonlate Android blocker screen/i);
  assert.match(html, /Work is due/i);
  assert.match(html, /You open a distraction/i);
  assert.match(html, /Nonlate checks/i);
  assert.match(html, /Blocker appears/i);
  assert.match(html, /The blocker is the product/i);
  assert.match(html, /02 · PLANNER/i);
  assert.match(html, /03 · SCHEDULE/i);
  assert.match(html, /Tasks you add manually and tasks synced from integrations/i);
  assert.match(html, /Pick a day, add due tasks to that day’s plan/i);
  assert.match(html, /Schedule places work from Planner alongside due tasks, calendar events, classes, and shifts/i);
  assert.match(html, /04 · APP PROTECTION/i);
  assert.match(html, /Choose which distracting apps Nonlate can interrupt/i);
  assert.match(html, /05 · CAN’T MISS ALARM/i);
  assert.match(html, /Attach an alarm to a task or scheduled item and choose the time/i);
  assert.match(html, /06 · AT A GLANCE/i);
  const productCardOrder = [
    "01 · DUE WORK",
    "02 · PLANNER",
    "03 · SCHEDULE",
    "04 · APP PROTECTION",
    "05 · CAN’T MISS ALARM",
    "06 · AT A GLANCE",
  ].map((label) => html.indexOf(label));
  assert.ok(productCardOrder.every((position) => position >= 0), "every product card must be present");
  assert.deepEqual(productCardOrder, [...productCardOrder].sort((a, b) => a - b), "product cards must follow the app flow");
  assert.match(html, /TODAY’S MESSAGE/i);
  assert.match(html, /Manual tasks and core blocking/i);
  assert.match(html, /Examples of social and entertainment apps you can protect/i);
  for (const appName of ["Instagram", "TikTok", "YouTube", "Snapchat", "Reddit", "Facebook"]) {
    assert.match(html, new RegExp(appName, "i"));
  }
  assert.match(html, /Focus Lock/i);
  assert.match(html, /Stronger break control/i);
  assert.match(html, /Tasks · every source/i);
  const realScreenOrder = [
    "Home · due tasks",
    "Tasks · every source",
    "Blocker · work due",
    "Planner · choose a day",
    "Schedule · timed day",
    "Insights · Focus Pulse",
  ].map((label) => html.indexOf(label));
  assert.ok(realScreenOrder.every((position) => position >= 0), "every real-screen card must be present");
  assert.deepEqual(realScreenOrder, [...realScreenOrder].sort((a, b) => a - b), "real screens must follow the product flow");
  assert.match(html, /12 built-in themes/i);
  assert.match(html, /\+8 more themes/i);
  assert.match(html, /Custom colors too/i);
  assert.match(html, /Coming soon to iOS and Android/i);
  assert.match(html, /"@type":"FAQPage"/i);
  assert.doesNotMatch(html, /TODAY’S REMINDER|Reminder only|Pause blocking|View the plan|Return with intention|planning, reminders, and app protection/i);
});

for (const [pathname, heading] of [
  ["support/index.html", "Support"],
  ["privacy/index.html", "Privacy Policy"],
  ["terms/index.html", "Terms of Service"],
  ["data-deletion/index.html", "Data Deletion"],
]) {
  test(`static export renders ${pathname}`, async () => {
    const html = await readPage(pathname);
    assert.match(html, new RegExp(heading, "i"));
    assert.match(html, /support@nonlate\.app/i);
    assert.match(html, /<main[^>]+id="main-content"/i);
  });
}

test("privacy export contains the current production disclosures", async () => {
  const html = await readPage("privacy/index.html");
  assert.match(html, /July 22, 2026/);
  assert.match(html, /Advertising and privacy choices/i);
  assert.match(html, /Birth month and year stored on your device/i);
  assert.match(html, /Google user data imported through connected Google services is never used for advertising/i);
  assert.match(html, /Ad privacy choices item in app settings/i);
});

test("client source retains every interaction and accessibility contract", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(page, /sessionStorage/);
  assert.match(page, /nonlate-intercept-seen-v1/);
  assert.match(page, /window\.innerHeight \* 2\.4/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /role="dialog"/);
  assert.match(page, /aria-modal="true"/);
  assert.match(page, /event\.key === "Escape"/);
  assert.match(page, /root\.inert = interceptOpen/);
  assert.match(page, /lastFocusedRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(page, /View tasks/);
  assert.match(page, /Website demo: these sample tasks are not real/i);
  assert.match(page, /View tasks” closes this website demo without moving the page/i);
  assert.doesNotMatch(page, /scrollIntoView|querySelector\("#tasks"\)/);
  assert.match(page, /10 \* 60 \* 1000/);
  assert.match(page, /\$\{platform\}-blocker\.png/);
  assert.match(page, /<BlockerCapture platform="ios" \/>/);
  assert.match(page, /<BlockerCapture platform="android" \/>/);
  assert.doesNotMatch(page, /storyboard|story-sequence|story-control|phase-dots|demo-controller/);
  assert.doesNotMatch(page, /ios-insights\.png|function (IOSPhone|AndroidPhone)|phone-shell/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /\.theme-more[^}]*grid-column:\s*1 \/ -1/);
  assert.match(css, /\.pulse-score[^}]*gap:\s*5px/);
  assert.match(css, /\.focus-lock-card > div p:first-child[^}]*var\(--font-jetbrains\)/);
  assert.doesNotMatch(css, /\.focus-lock-card > div p\s*\{/);
  assert.match(css, /\.reveal-ready \[data-reveal\]/);
  assert.match(css, /height:\s*clamp\(400px, 110vw, 670px\)/);
  assert.match(css, /padding-block:\s*72px 0/);
});

test("deployment-critical assets are present in source and output", async () => {
  const paths = [
    "public/.well-known/apple-app-site-association",
    "public/.well-known/assetlinks.json",
    "public/.well-known/microsoft-identity-association.json",
    "public/app-ads.txt",
    "public/deadline/oauth/callback/oauth-ui.js",
    "public/og.png",
    "public/assets/screens/ios-blocker.png",
    "public/assets/screens/ios-tasks.png",
    "public/assets/screens/android-blocker.png",
    "out/CNAME",
    "out/404.html",
  ];
  await Promise.all(paths.map((pathname) => access(new URL(pathname, root))));
});
