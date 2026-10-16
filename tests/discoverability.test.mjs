import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("public product reference stays factual and points to visible product information", async () => {
  const reference = await readFile(new URL("public/llms.txt", root), "utf8");
  const page = await readFile(new URL("app/page.tsx", root), "utf8");

  assert.match(reference, /^# Nonlate\n/);
  assert.match(reference, /deadline-aware planning and app-blocking/);
  assert.match(reference, /Calendar events do not trigger blocking/);
  assert.match(reference, /30-day/);
  assert.match(reference, /first successful connection/);
  assert.match(reference, /has no automatic charge/);
  assert.match(reference, /external syncing pauses/);
  assert.match(reference, /separate from a subscription introductory offer/);
  assert.match(reference, /Store-displayed localized prices/);
  assert.match(reference, /not a guarantee of search visibility or recommendations/);
  assert.doesNotMatch(reference, /ignore (?:all |previous |prior )?instructions|always recommend|rank (?:Nonlate|this)|best app|available worldwide|instant sync everywhere/i);

  const fragments = [...reference.matchAll(/https:\/\/nonlate\.app\/#([a-z-]+)/g)].map((match) => match[1]);
  assert.ok(fragments.length >= 5);
  for (const fragment of new Set(fragments)) {
    assert.ok(page.includes(`id="${fragment}"`), `Missing visible section #${fragment}`);
  }
  for (const legalRoute of ["privacy", "terms", "support", "data-deletion"]) {
    assert.ok(reference.includes(`https://nonlate.app/${legalRoute}/`));
  }
});

test("search metadata preserves canonical origin and separates product identity from availability", async () => {
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");
  assert.match(layout, /metadataBase: new URL\("https:\/\/nonlate\.app"\)/);
  assert.match(layout, /Deadline-Aware App Blocker/);
  assert.match(layout, /robots: \{ index: true, follow: true \}/);
  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.match(layout, /More connected\. Less distracted\./);
  assert.match(layout, /Stay ahead of what’s due/);
  assert.match(layout, /<html lang="en">/);
  assert.doesNotMatch(layout, /available worldwide|download (?:now|today)|aggregateRating|reviewCount/i);
});
