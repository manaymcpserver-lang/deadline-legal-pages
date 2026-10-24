import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import locales from "./guides/locales.json";
import type { WebsiteStrings } from "./components/WebsiteLocale";

export const homepageLanguages = Object.fromEntries([...locales.map((code) => [code === "fil" ? "tl" : code, code === "en" ? "/" : `/${code}/`]), ["x-default", "/"]]);
export function homepageStrings(locale: string): WebsiteStrings {
  if (locale === "en") return {};
  const file = path.join(process.cwd(), "translations/homepage", `${locale}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing homepage translation: ${locale}`);
  const dictionary = JSON.parse(fs.readFileSync(file, "utf8"));
  const allowDraft = process.env.NONLATE_TRANSLATION_DRAFT === "1" || Boolean(process.env.NONLATE_PREVIEW_LOCALES);
  if (!allowDraft && dictionary.reviewStatus !== "approved") {
    throw new Error(`Homepage translation ${locale} has not passed semantic review. Production export is blocked. Use NONLATE_TRANSLATION_DRAFT=1 only for local translation QA.`);
  }
  const strings = dictionary.strings;
  const source = JSON.parse(fs.readFileSync(path.join(process.cwd(), "translations/homepage/source.json"), "utf8")).strings as string[];
  for (const key of source) {
    if (typeof strings?.[key] !== "string" || !strings[key].trim()) throw new Error(`Incomplete homepage translation: ${locale}: ${key}`);
  }
  if (Object.keys(strings).length !== source.length) throw new Error(`Stale homepage translation keys: ${locale}`);
  return strings;
}
export function homepageMetadata(locale: string): Metadata {
  const strings = homepageStrings(locale);
  const t = (key: string) => strings[key] ?? key;
  const canonical = locale === "en" ? "/" : `/${locale}/`;
  return {
    robots: locale !== "en" && (process.env.NONLATE_TRANSLATION_DRAFT === "1" || Boolean(process.env.NONLATE_PREVIEW_LOCALES)) ? { index: false, follow: false } : { index: true, follow: true },
    title: { absolute: t("Nonlate App | Deadline-Aware App Blocker") },
    description: t("Nonlate brings tasks, calendars, and supported connected sources into one plan, then blocks selected distractions when work is due. Built for iOS and Android."),
    alternates: { canonical, languages: homepageLanguages },
    openGraph: { type: "website", siteName: "Nonlate", url: canonical, locale: locale.replace("-", "_"), title: t("Nonlate | More connected. Less distracted."), description: t("Stay ahead of what’s due. Bring manual and connected tasks together, plan your day, and interrupt selected distractions when work needs attention."), images: [{ url: "/og-launch-2026-10.png", width: 1536, height: 1024, alt: t("Nonlate deadline blockers on iOS and Android") }] },
    twitter: { card: "summary_large_image", title: t("Nonlate | More connected. Less distracted."), description: t("Stay ahead of what’s due. Bring manual and connected tasks together, plan your day, and interrupt selected distractions when work needs attention."), images: ["/og-launch-2026-10.png"] },
  };
}
