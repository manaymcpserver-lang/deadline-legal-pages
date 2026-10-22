"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import locales from "../guides/locales.json";
import languageNames from "../guides/language-names.json";
import { firstGuide, planningGuide } from "../guides/guide-data";
import planningLocales from "../guides/planning-locales.json";
import mediaLabels from "../../translations/media-labels.json";
import playMediaLabels from "../../translations/play-media-labels.json";

// Fixed names keep static HTML and client hydration identical across ICU versions.
const nativeLanguageNames: Record<string, string> = languageNames;

export type WebsiteStrings = Record<string, string>;
export type WebsiteScreenshot = { src: string; language: string; kind?: string; width?: number; height?: number };
export type ScreenshotMap = Record<string, WebsiteScreenshot>;
const identity = <T,>(value: T): T => value;
const LocaleContext = createContext({
  locale: "en", t: identity,
  illustrationLabel: mediaLabels.en,
  playIllustrationLabel: playMediaLabels.en,
  localHref: (href: string) => href,
  screenshot: (src: string): WebsiteScreenshot => ({ src, language: "en" }),
});

export function homePath(locale: string) { return locale === "en" ? "/" : `/${locale}/`; }

export function WebsiteLocaleProvider({ locale, strings, screenshots = {}, children }: {
  locale: string; strings: WebsiteStrings; screenshots?: ScreenshotMap; children: ReactNode;
}) {
  const value = useMemo(() => ({
    locale,
    illustrationLabel: (mediaLabels as Record<string, string>)[locale] ?? mediaLabels.en,
    playIllustrationLabel: (playMediaLabels as Record<string, string>)[locale] ?? playMediaLabels.en,
    t: <T,>(input: T): T => {
      if (typeof input !== "string" || locale === "en") return input;
      const key = input.replace(/\s+/g, " ").trim();
      const translated = strings[key];
      if (!translated) return input;
      return `${input.match(/^\s*/)?.[0] ?? ""}${translated}${input.match(/\s*$/)?.[0] ?? ""}` as T;
    },
    localHref: (href: string) => {
      if (href === "/" || href.startsWith("/#")) return `${homePath(locale)}${href.slice(1)}`;
      if (href === "/guides/") return locale === "en" ? href : `/guides/${locale}/`;
      if (["/privacy/", "/terms/", "/support/", "/data-deletion/"].includes(href)) return locale === "en" ? href : `/${locale}${href}`;
      return href;
    },
    screenshot: (src: string) => screenshots[src] ?? { src, language: "en" },
  }), [locale, strings, screenshots]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = ["ar", "fa", "he", "ur"].includes(locale) ? "rtl" : "ltr";
    return () => {
      document.documentElement.lang = "en";
      document.documentElement.dir = "ltr";
    };
  }, [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useWebsiteLocale() { return useContext(LocaleContext); }

export function WebsiteLanguageMenu() {
  const { locale, t } = useWebsiteLocale();
  const pathname = usePathname();
  let guideSuffix = pathname.startsWith("/guides/") ? pathname.slice("/guides/".length) : null;
  if (guideSuffix !== null && locales.includes(guideSuffix.split("/")[0])) guideSuffix = guideSuffix.split("/").slice(1).join("/");
  // Article translation availability is explicit. Other language choices go
  // to their guide index, never a missing or falsely localized article route.
  const isPlanningArticle = guideSuffix?.replace(/\/$/, "") === planningGuide.href.slice("/guides/".length).replace(/\/$/, "");
  const isEnglishArticle = guideSuffix !== null && guideSuffix !== "" && guideSuffix.replace(/\/$/, "") !== firstGuide.href.slice("/guides/".length).replace(/\/$/, "");
  const policy = ["/privacy/", "/terms/", "/support/", "/data-deletion/"].find(route => pathname.replace(/\/$/, "").endsWith(route.replace(/\/$/, "")));
  const destination = (code: string) => policy ? `${code === "en" ? "" : `/${code}`}${policy}` : guideSuffix === null ? homePath(code) : `/guides/${code === "en" ? "" : `${code}/`}${isEnglishArticle && code !== "en" && !(isPlanningArticle && planningLocales.includes(code)) ? "" : guideSuffix}`;
  const name = (code: string) => nativeLanguageNames[code] ?? code;
  return <details className="website-languages" data-language-switcher>
    <summary>{t("Language")} · <span lang={locale}>{name(locale)}</span></summary>
    <nav aria-label={t("Available languages")}>
      {locales.map((code) => <a key={code} href={destination(code)} hrefLang={code === "fil" ? "tl" : code} lang={code} aria-current={code === locale ? "page" : undefined}>{name(code)}</a>)}
    </nav>
  </details>;
}
