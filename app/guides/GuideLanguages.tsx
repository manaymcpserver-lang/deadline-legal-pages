import locales from "./locales.json";
import languageNames from "./language-names.json";
import { firstGuide } from "./guide-data";

export function guidePath(locale: string, article: boolean, articleHref = firstGuide.href) {
  const suffix = article ? articleHref.slice("/guides/".length) : "";
  return locale === "en" ? `/guides/${suffix}` : `/guides/${locale}/${suffix}`;
}

export function guideAlternates(article: boolean, articleHref = firstGuide.href, availableLocales: string[] = locales) {
  return Object.fromEntries([
    ...availableLocales.map((locale) => [locale === "fil" ? "tl" : locale, `https://nonlate.app${guidePath(locale, article, articleHref)}`]),
    ["x-default", `https://nonlate.app${guidePath("en", article, articleHref)}`],
  ]);
}

export function GuideLanguages({ article = false, articleHref = firstGuide.href, availableLocales = locales }: { article?: boolean; articleHref?: string; availableLocales?: string[] }) {
  return (
    <details className="guide-languages">
      <summary>Language · English</summary>
      <nav aria-label="Available languages">
        {availableLocales.map((locale) => (
          <a href={guidePath(locale, article, articleHref)} lang={locale} hrefLang={locale === "fil" ? "tl" : locale} key={locale} aria-current={locale === "en" ? "page" : undefined}>
            {languageNames[locale as keyof typeof languageNames]}
          </a>
        ))}
      </nav>
    </details>
  );
}
