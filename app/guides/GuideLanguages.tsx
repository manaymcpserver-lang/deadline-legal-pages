import locales from "./locales.json";
import languageNames from "./language-names.json";
import { firstGuide } from "./guide-data";

export function guidePath(locale: string, article: boolean) {
  const suffix = article ? firstGuide.href.slice("/guides/".length) : "";
  return locale === "en" ? `/guides/${suffix}` : `/guides/${locale}/${suffix}`;
}

export function guideAlternates(article: boolean) {
  return Object.fromEntries([
    ...locales.map((locale) => [locale === "fil" ? "tl" : locale, `https://nonlate.app${guidePath(locale, article)}`]),
    ["x-default", `https://nonlate.app${guidePath("en", article)}`],
  ]);
}

export function GuideLanguages({ article = false }: { article?: boolean }) {
  return (
    <details className="guide-languages">
      <summary>Language · English</summary>
      <nav aria-label="Available languages">
        {locales.map((locale) => (
          <a href={guidePath(locale, article)} lang={locale} hrefLang={locale === "fil" ? "tl" : locale} key={locale} aria-current={locale === "en" ? "page" : undefined}>
            {languageNames[locale as keyof typeof languageNames]}
          </a>
        ))}
      </nav>
    </details>
  );
}
