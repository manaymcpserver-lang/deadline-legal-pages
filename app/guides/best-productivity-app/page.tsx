import type { Metadata } from "next";
import Link from "next/link";
import { appStoreUrl, playStoreUrl } from "../../site-data";
import { productivityGuide as guide, firstGuide } from "../guide-data";
import { GuideLanguages, guideAlternates } from "../GuideLanguages";
import copy from "../../../translations/productivity-guide/copy.json";

const text = copy.en;
export const metadata: Metadata = {
  title: guide.title, description: guide.description,
  alternates: { canonical: guide.href, languages: guideAlternates(true, guide.href) },
  authors: [{ name: "Nonlate", url: "https://nonlate.app/" }],
  openGraph: { type: "article", title: guide.title, description: guide.description, url: guide.href, publishedTime: guide.date, modifiedTime: guide.date, images: ["/og-launch-2026-10.png"] },
  twitter: { card: "summary_large_image", title: guide.title, description: guide.description, images: ["/og-launch-2026-10.png"] },
};

export default function ProductivityGuide() {
  const schema = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", headline: guide.title, description: guide.description, mainEntityOfPage: `https://nonlate.app${guide.href}`, inLanguage: "en", datePublished: guide.date, dateModified: guide.date, author: { "@type": "Organization", name: "Nonlate", url: "https://nonlate.app/" }, publisher: { "@type": "Organization", name: "Nonlate" }, image: "https://nonlate.app/og-launch-2026-10.png" },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://nonlate.app/" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://nonlate.app/guides/" },
      { "@type": "ListItem", position: 3, name: guide.title, item: `https://nonlate.app${guide.href}` },
    ] },
  ] };
  return <>
    <GuideLanguages article articleHref={guide.href} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <nav className="guide-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides/">Guides</Link></nav>
    <article className="guide-article">
      <header className="guides-heading">
        <h1>{text.title}</h1><p>{text.intro}</p>
        <p className="guide-byline">Nonlate · <time dateTime={guide.date}>{guide.date}</time></p>
        <p className="guide-disclosure">{text.disclosure}</p>
      </header>
      <section><h2>{text.chooseHeading}</h2><p>{text.choose}</p></section>
      <section><h2>{text.nonlateHeading}</h2><p>{text.nonlate}</p><p>{text.limits}</p></section>
      <section className="guide-answer"><h2>{text.testHeading}</h2><p>{text.test}</p>
        <div className="guide-downloads"><a className="guide-read-link" href={appStoreUrl}>Download Nonlate on the App Store</a><a className="guide-read-link" href={playStoreUrl}>Get Nonlate on Google Play</a></div>
      </section>
      <nav className="guide-toc" aria-label="Guides"><ul><li><Link href={firstGuide.href}>{firstGuide.title}</Link></li></ul></nav>
    </article>
    <Link className="guide-back" href="/guides/">← All guides</Link>
  </>;
}
