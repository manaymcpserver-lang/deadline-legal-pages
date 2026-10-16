import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const out = new URL("../out/", import.meta.url);

const readPage = (pathname) => readFile(new URL(pathname, out), "utf8");

function visibleText(html) {
  const entities = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"', rsquo: "’" };
  return html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
      const lower = code.toLowerCase();
      if (lower.startsWith("#x")) return String.fromCodePoint(Number.parseInt(lower.slice(2), 16));
      if (lower.startsWith("#")) return String.fromCodePoint(Number.parseInt(lower.slice(1), 10));
      return entities[lower] ?? entity;
    }).replace(/\s+/g, " ").trim();
}

test("static export contains the production landing experience", async () => {
  const html = await readPage("index.html");
  const text = visibleText(html);
  assert.match(text, /More connected\. Less distracted\./i);
  assert.match(text, /From all over the place\. To one place\./i);
  assert.match(text, /Stay ahead of what’s due\./i);
  assert.match(text, /Try the blocker demo/i);
  assert.match(html, /Actual Nonlate iOS blocker screen/i);
  assert.match(html, /Actual Nonlate Android blocker screen/i);
  assert.match(html, /Work is due/i);
  assert.match(html, /You open a distraction/i);
  assert.match(html, /Nonlate checks/i);
  assert.match(html, /Blocker appears/i);
  assert.match(text, /Add your own tasks or connect your existing tools/i);
  assert.match(text, /Choose a day in Planner/i);
  assert.match(text, /planned work, deadlines, events, classes, and shifts together in Schedule/i);
  assert.match(text, /Your chosen distractions can wait/i);
  assert.match(text, /Can’t Miss Alarms use the strongest alarm presentation supported by your device/i);
  assert.match(text, /Widgets and supported iPhone Live Activities/i);
  const productCardOrder = [
    "01 · CONNECT",
    "02 · PLAN",
    "03 · FOCUS",
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
  assert.match(text, /Only unfinished due tasks trigger blocking/i);
  assert.match(text, /not calendar events/i);
  assert.match(html, /Nonlate App \| Deadline-Aware App Blocker/i);
  assert.match(html, /name="robots" content="index, follow"/i);
  assert.match(html, /"alternateName":"Nonlate App"/i);
  const realScreenOrder = [
    "Home · due tasks",
    "Planner · choose a day",
    "Schedule · timed day",
    "Insights · Focus Pulse",
  ].map((label) => html.indexOf(label));
  assert.ok(realScreenOrder.every((position) => position >= 0), "every real-screen card must be present");
  assert.deepEqual(realScreenOrder, [...realScreenOrder].sort((a, b) => a - b), "real screens must follow the product flow");
  assert.match(html, /12 built-in themes/i);
  assert.match(html, /\+8 more themes/i);
  assert.match(html, /Custom colors too/i);
  assert.match(text, /Download for iOS/i);
  assert.match(text, /Get it on Android/i);
  assert.match(text, /availability and compatible devices may vary by country/i);
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
  assert.match(html, /October 12, 2026/);
  assert.match(html, /No advertising/i);
  assert.match(html, /Signed trial certificates/i);
  assert.match(html, /Limited Use requirements/i);
  assert.match(html, /not automatically deleted after 90 days/i);
  assert.doesNotMatch(html, /Eligible adults using the free version/);
});

test("plans and FAQ disclose the current ad-free source trial and localized purchase terms", async () => {
  const html = await readPage("index.html");
  for (const text of ["$5.99 / month", "$59.99 / year", "$11.99 / month", "$99.99 / year", "billed annually", "USD reference prices", "full localized renewal price", "30 days", "no automatic charge", "external syncing pauses", "local completion and blocking", "No Nonlate account is required", "Plus free for 7 days on Monthly or Yearly", "renews automatically unless cancelled", "does not add a Pro trial or restart the source-preview window"]) {
    assert.ok(html.includes(text), `missing current product term: ${text}`);
  }
  assert.doesNotMatch(html, /Ads for eligible users|exact store pricing appears at launch|Coming soon to iOS and Android|Android coming soon|iOS available in Mozambique/);
  assert.match(html, /href="https:\/\/apps\.apple\.com\/app\/id6759996284"/);
  assert.match(html, /href="https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.nonlate\.app"/);
  const data = JSON.parse(html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)[1]);
  const faq = data["@graph"].find(item => item["@type"] === "FAQPage").mainEntity;
  const visibleFaq = [...html.matchAll(/<details\b[^>]*>\s*<summary\b[^>]*>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>\s*<\/details>/gi)]
    .map(([, question, answer]) => ({
      question: visibleText(question.replace(/<span\b[^>]*>[\s\S]*?<\/span>/gi, "")),
      answer: visibleText(answer),
    }));
  assert.equal(visibleFaq.length, 10, "all ten product questions must remain visible");
  assert.deepEqual(faq.map(item => ({ question: item.name, answer: item.acceptedAnswer.text })), visibleFaq,
    "structured FAQ questions and answers must exactly match the visible FAQ");
});

test("client source retains every interaction and accessibility contract", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);

  assert.match(page, /sessionStorage/);
  assert.doesNotMatch(page, /nonlate-intercept-seen-v1|window\.innerHeight \* 2\.4/,
    "scrolling must not automatically open the intercept dialog");
  assert.match(page, /onClick=\{openIntercept\}/, "the demo must require an explicit button action");
  assert.match(page, /const openIntercept = useCallback\([\s\S]*?setInterceptOpen\(true\)/);
  assert.equal([...page.matchAll(/setInterceptOpen\(true\)/g)].length, 1,
    "only the explicit demo handler may open the dialog");
  assert.doesNotMatch(page, /\bopenIntercept\s*\(/, "effects must not invoke the demo handler automatically");
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /const getServerMotionPreference = \(\) => true/,
    "static rendering must keep films still until the browser motion preference is known");
  assert.match(page, /useSyncExternalStore\(\s*subscribeMotionPreference,\s*getMotionPreference,\s*getServerMotionPreference/,
    "the first client render must agree with the server motion snapshot");
  assert.match(page, /role="dialog"/);
  assert.match(page, /aria-modal="true"/);
  assert.match(page, /event\.key === "Escape"/);
  assert.match(page, /event\.key !== "Tab"/);
  assert.match(page, /document\.activeElement === first/);
  assert.match(page, /document\.activeElement === last/);
  assert.match(page, /last\.focus\(\)/);
  assert.match(page, /first\.focus\(\)/);
  assert.match(page, /root\.inert = interceptOpen/);
  assert.match(page, /lastFocusedRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(page, /View tasks/);
  assert.match(page, /Take a 10-minute break/);
  assert.doesNotMatch(page, /Start a 10-minute demo break/);
  assert.match(page, /Website demo: these sample tasks are not real/i);
  assert.match(page, /View tasks” closes this website demo without moving the page\.<\/p>/i);
  assert.doesNotMatch(page, /Press Esc to dismiss or replay it anytime/i);
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
  assert.match(css, /\.dual-phone-stage\s*\{[^}]*height:\s*clamp\(/,
    "both platform captures need a responsive stage");
  assert.match(css, /\.capture-frame img\s*\{[^}]*height:\s*auto/,
    "real blocker captures must preserve their image proportions");
  assert.match(css, /\.dialog-actions\s*\{[^}]*grid-template-columns:\s*\.82fr 1\.18fr/);
  assert.match(css, /\.dialog-actions \.button-secondary\s*\{[^}]*white-space:\s*nowrap/);
  assert.match(css, /\.dialog-tasks > \.mini-task \+ \.mini-task\s*\{[^}]*margin-top:\s*0/);
  assert.match(css, /max-height:\s*calc\(100dvh - 16px\)/);
  assert.match(css, /\.screen-rail\s*\{[^}]*overflow-x:\s*auto/,
    "the real-screen gallery must remain scrollable on narrow devices");
});

test("the automatic integration banner includes every source before the blocker story", async () => {
  const html = await readPage("index.html");
  const preview = html.match(/<section\b[^>]*aria-labelledby="integration-preview-title"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(preview, "a compact integration strip must follow the hero");
  assert.match(preview, /Works with your tools/);
  assert.doesNotMatch(preview, /See all integrations/);
  assert.match(preview, /tabindex="0"/i);
  const lists = [...preview.matchAll(/<ul\b[^>]*>([\s\S]*?)<\/ul>/g)];
  assert.equal(lists.length, 2, "a matching duplicate must make the banner seamless");
  assert.match(lists[1][0], /aria-hidden="true"/, "screen readers must not hear the duplicate");
  assert.equal(lists[0][1], lists[1][1], "the repeated content must match exactly");
  const fullSection = html.match(/<section\b[^>]*id="integrations"[^>]*>([\s\S]*?)<\/section>/)[1];
  const expectedNames = [...fullSection.matchAll(/<span class="source-pill">[\s\S]*?<span>([^<]+)<\/span>/g)].map((match) => visibleText(match[1]));
  assert.equal(expectedNames.length, 25);
  assert.equal([...lists[0][1].matchAll(/<li\b/g)].length, expectedNames.length);
  for (const name of expectedNames) {
    assert.ok(visibleText(lists[0][1]).includes(name), `missing banner source ${name}`);
  }
  assert.ok(html.indexOf('id="hero-title"') < html.indexOf('id="integration-preview-title"'));
  assert.ok(html.indexOf('id="integration-preview-title"') < html.indexOf('id="moment"'));
  assert.ok(html.indexOf('id="moment"') < html.indexOf('id="integrations"'));
  const css = await readFile(new URL("app/globals.css", root), "utf8");
  assert.match(css, /\.integration-preview-window\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(css, /\.integration-preview-track\s*\{[^}]*animation:\s*integration-scroll 90s linear infinite/);
  assert.match(css, /translate3d\(-50%, 0, 0\)/);
  assert.match(css, /\.integration-preview-track\s*\{ animation: none; transform: none;/);
  const stylesheets = [...new Set([...html.matchAll(/<link\b[^>]*href="([^\"]+\.css)"[^>]*>/g)].map((match) => match[1]))];
  assert.ok(stylesheets.length > 0, "the exported page must link its stylesheet");
  const exportedCss = (await Promise.all(stylesheets.map((pathname) => readFile(new URL(pathname.replace(/^\//, ""), out), "utf8")))).join("\n");
  assert.match(exportedCss, /\.integration-preview-track\s*\{[^}]*animation:\s*[^;]*integration-scroll/,
    "the production stylesheet, not only source CSS, must include the automatic banner");
});

test("mascot films remain optional, quiet, and lightweight before interaction", async () => {
  const html = await readPage("index.html");
  const videos = [...html.matchAll(/<video\b[^>]*>[\s\S]*?<\/video>/gi)].map(match => match[0]);
  assert.equal(videos.length, 2, "both selected mascot vignettes must render");
  for (const video of videos) {
    const openingTag = video.match(/^<video\b[^>]*>/i)[0];
    assert.match(openingTag, /\bpreload="none"/i);
    assert.match(openingTag, /\bmuted(?:\s|=|>)/i);
    assert.match(openingTag, /\bplaysinline(?:\s|=|>)/i);
    assert.match(openingTag, /\bloop(?:\s|=|>)/i, "both visible films must repeat without a Play action");
    assert.match(openingTag, /\bposter="\/assets\/films\/[^"/]+\.jpg"/i);
    assert.doesNotMatch(openingTag, /\bautoplay(?:\s|=|>)/i,
      "playback must be controlled by visibility and motion preferences, not an autoplay attribute");
  }
  for (const name of ["outrun-distraction", "deadline-in-the-wild"]) {
    assert.ok(videos.some(video => video.includes(`/assets/films/${name}.jpg`)), `missing ${name} poster`);
    assert.ok(videos.some(video => video.includes(`/assets/films/${name}.mp4`)), `missing ${name} source`);
    for (const extension of ["mp4", "jpg"]) {
      const pathname = `assets/films/${name}.${extension}`;
      await access(new URL(`public/${pathname}`, root));
      await access(new URL(pathname, out));
    }
  }
});

test("mascot playback loops without on-page controls and respects device preferences", async () => {
  const component = await readFile(new URL("app/components/MascotVignette.tsx", root), "utf8");
  assert.match(component, /new IntersectionObserver/);
  assert.match(component, /if \(!inViewRef\.current \|\| document\.hidden \|\| reducedMotion\)\s*\{\s*pause\(\)/,
    "off-screen, hidden-tab and reduced-motion films must stop");
  assert.match(component, /if \(!autoplayBlockedRef\.current && video\.paused\)/,
    "visible films must resume automatically unless the browser denied playback");
  assert.match(component, /autoplayBlockedRef\.current = true/);
  assert.match(component, /addEventListener\("visibilitychange", syncPlayback\)/);
  assert.match(component, /removeEventListener\("visibilitychange", syncPlayback\)/);
  assert.match(component, /observer\?\.disconnect\(\)/);
  assert.match(component, /video\.pause\(\)/);
  assert.match(component, /video\.muted = true/);
  assert.match(component, /video\.play\(\)\.catch\(/, "denied playback must be handled");
  assert.doesNotMatch(component, /<button\b|togglePlayback|motionPaused/);
  const html = await readPage("index.html");
  assert.doesNotMatch(visibleText(html), /(?:Pause|Resume) animations|(?:Pause|Replay|Play) .* animation/);
  for (const video of html.matchAll(/<video\b[^>]*>/g)) {
    assert.doesNotMatch(video[0], /\bcontrols(?:\s|=|>)/i);
  }
  assert.match(component, /aria-describedby=/);
  assert.match(component, /Silent brand animation, not an app recording/);
  assert.doesNotMatch(component, /<video\b[^>]*\bautoPlay(?:\s|=|>)/,
    "automatic playback must start through the visibility and motion guards");
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
