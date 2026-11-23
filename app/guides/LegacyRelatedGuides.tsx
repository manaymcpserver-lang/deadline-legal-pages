import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import related from "./legacy-related.json";
import ui from "./search-ui.json";

const contentDir = join(process.cwd(), "app/guides/search-content");
const titles = new Map(
  readdirSync(contentDir)
    .filter(name => name.endsWith(".json") && name !== "reviews.json")
    .map(name => {
      const guide: { slug: string; locales: { en: { title: string } } } = JSON.parse(
        readFileSync(join(contentDir, name), "utf8"),
      );
      return [guide.slug, guide.locales.en.title];
    }),
);

export default function LegacyRelatedGuides({ guide }: { guide: keyof typeof related }) {
  return (
    <nav id="related" className="guide-toc" lang="en" aria-label={ui.en.related}>
      <h2>{ui.en.related}</h2>
      <ul>
        {related[guide].map(slug => {
          const title = titles.get(slug);
          if (!title) throw new Error(`Unknown related guide: ${slug}`);
          return <li key={slug}><a href={`/guides/${slug}/`} hrefLang="en">{title}</a></li>;
        })}
      </ul>
    </nav>
  );
}
