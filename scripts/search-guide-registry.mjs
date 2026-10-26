import { readFileSync, readdirSync } from "node:fs";

const directory = new URL("../app/guides/search-content/", import.meta.url);
export const searchGuides = readdirSync(directory).filter(name => name.endsWith(".json") && name !== "reviews.json")
  .sort().map(name => JSON.parse(readFileSync(new URL(name, directory), "utf8")));
export const searchGuidePath = (locale, slug) => `/guides/${locale === "en" ? "" : `${locale}/`}${slug}/`;
export const searchGuideRoutes = searchGuides.flatMap(guide => Object.keys(guide.locales).map(locale => searchGuidePath(locale, guide.slug)));
