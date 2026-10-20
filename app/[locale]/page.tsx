import { notFound } from "next/navigation";
import Home from "../HomePage";
import locales from "../guides/locales.json";
import { homepageMetadata, homepageStrings } from "../homepage-locale";
import { WebsiteLocaleProvider } from "../components/WebsiteLocale";
import artwork from "../homepage-artwork.json";

export const dynamicParams = false;
export function generateStaticParams() {
  const preview = process.env.NONLATE_PREVIEW_LOCALES?.split(",");
  return locales.filter((locale) => locale !== "en" && (!preview || preview.includes(locale))).map((locale) => ({ locale }));
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();
  return homepageMetadata(locale);
}
export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();
  const localizedArtwork = (artwork.assets as Record<string, import("../components/WebsiteLocale").ScreenshotMap>)[locale] ?? {};
  // Only render data belongs in the public client payload, not local provenance paths.
  const screenshots = Object.fromEntries(Object.entries(localizedArtwork).map(([slot, {src, language, kind, width, height}]) => [slot, {src, language, kind, width, height}]));
  return <WebsiteLocaleProvider locale={locale} strings={homepageStrings(locale)} screenshots={screenshots}><Home /></WebsiteLocaleProvider>;
}
