import type { Metadata } from "next";
import Link from "next/link";
import { firstGuide, planningGuide, productivityGuide } from "./guide-data";
import { GuideLanguages, guideAlternates } from "./GuideLanguages";

const title = "Guides to tasks, deadlines and fewer distractions";
const description = "Practical Nonlate guides to organizing deadlines, planning your work and managing distracting apps on iPhone and Android.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guides/", languages: guideAlternates(false) },
  openGraph: { type: "website", title, description, url: "/guides/", images: ["/og-launch-2026-10.png"] },
  twitter: { card: "summary_large_image", title, description, images: ["/og-launch-2026-10.png"] },
};

export default function GuidesPage() {
  return (
    <>
      <GuideLanguages />
      <header className="guides-heading">
        <p className="eyebrow"><span /> Nonlate guides</p>
        <h1>A little less scrolling.<br />A clearer next step.</h1>
        <p>Practical answers about tasks, deadlines and distractions. Start with one change you can use today.</p>
      </header>
      <div className="guides-list">
        <article className="guide-card" lang="en" dir="ltr">
          <p className="guide-category">Planning · School, work &amp; everyday life · English</p>
          <h2><Link href={planningGuide.href} hrefLang="en">{planningGuide.title}</Link></h2>
          <p>{planningGuide.description}</p>
          <p className="guide-byline">By Nonlate · <time dateTime={planningGuide.date}>{planningGuide.displayDate}</time></p>
          <Link className="guide-read-link" href={planningGuide.href} hrefLang="en">Read in English <span aria-hidden="true">↗</span></Link>
        </article>
        <article className="guide-card">
          <p className="guide-category">App blocking · iPhone &amp; Android</p>
          <h2><Link href={firstGuide.href}>{firstGuide.title}</Link></h2>
          <p>{firstGuide.description}</p>
          <p className="guide-byline">By Nonlate · <time dateTime={firstGuide.date}>{firstGuide.displayDate}</time></p>
          <Link className="guide-read-link" href={firstGuide.href}>Read the guide <span aria-hidden="true">↗</span></Link>
        </article>
      </div>
      <div className="guides-list">
        <article className="guide-card" lang="en" dir="ltr" data-guide="productivity">
          <h2><Link href={productivityGuide.href} hrefLang="en">{productivityGuide.title}</Link></h2>
          <p>{productivityGuide.description}</p>
          <p className="guide-byline">Nonlate · <time dateTime={productivityGuide.date}>{productivityGuide.date}</time></p>
          <Link className="guide-read-link" href={productivityGuide.href} hrefLang="en">Read the guide <span aria-hidden="true">↗</span></Link>
        </article>
      </div>
    </>
  );
}
