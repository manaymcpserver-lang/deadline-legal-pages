/* eslint-disable @next/next/no-img-element -- reuse the existing, pre-sized product screenshots and official badges */
import type { Metadata } from "next";
import Link from "next/link";
import { appStoreUrl, playStoreUrl } from "../../site-data";
import { firstGuide } from "../guide-data";
import { GuideLanguages, guideAlternates } from "../GuideLanguages";

export const metadata: Metadata = {
  title: firstGuide.title,
  description: firstGuide.description,
  alternates: { canonical: firstGuide.href, languages: guideAlternates(true) },
  authors: [{ name: "Nonlate", url: "https://nonlate.app/" }],
  openGraph: {
    type: "article",
    title: firstGuide.title,
    description: firstGuide.description,
    url: firstGuide.href,
    publishedTime: firstGuide.date,
    modifiedTime: firstGuide.date,
    authors: ["Nonlate"],
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Nonlate blockers on iPhone and Android" }],
  },
  twitter: { card: "summary_large_image", title: firstGuide.title, description: firstGuide.description, images: ["/og.png"] },
};

const sections = [
  ["quick-answer", "The short answer"],
  ["setup", "Set up deadline-aware blocking"],
  ["platforms", "iPhone and Android differences"],
  ["example", "A practical example"],
  ["troubleshooting", "If blocking does not appear"],
  ["questions", "Common questions"],
] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `https://nonlate.app${firstGuide.href}#article`,
      headline: firstGuide.title,
      description: firstGuide.description,
      mainEntityOfPage: `https://nonlate.app${firstGuide.href}`,
      datePublished: firstGuide.date,
      dateModified: firstGuide.date,
      inLanguage: "en",
      author: { "@type": "Organization", name: "Nonlate", url: "https://nonlate.app/" },
      publisher: { "@type": "Organization", name: "Nonlate", url: "https://nonlate.app/", logo: { "@type": "ImageObject", url: "https://nonlate.app/assets/brand/icon-512.png" } },
      image: "https://nonlate.app/og.png",
      about: { "@type": "SoftwareApplication", name: "Nonlate", operatingSystem: "iOS, Android", url: "https://nonlate.app/" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://nonlate.app/" },
        { "@type": "ListItem", position: 2, name: "Guides", item: "https://nonlate.app/guides/" },
        { "@type": "ListItem", position: 3, name: firstGuide.title, item: `https://nonlate.app${firstGuide.href}` },
      ],
    },
  ],
};

function DownloadLinks() {
  return (
    <div className="store-badges guide-downloads" aria-label="Download Nonlate">
      <a className="store-badge" href={appStoreUrl}><img src="/assets/store-badges/app-store.svg" alt="Download Nonlate on the App Store" width="120" height="40" /></a>
      <a className="store-badge" href={playStoreUrl}><img src="/assets/store-badges/google-play.svg" alt="Get Nonlate on Google Play" width="239" height="71" /></a>
    </div>
  );
}

export default function AppBlockingGuide() {
  return (
    <>
      <GuideLanguages article />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <nav className="guide-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides/">Guides</Link><span aria-hidden="true">/</span><span aria-current="page">App blocking</span></nav>
      <article className="guide-article">
        <header className="guides-heading">
          <p className="eyebrow"><span /> App blocking · iPhone &amp; Android</p>
          <h1>{firstGuide.title}</h1>
          <p>Opening a social app can be automatic. A task-aware blocker adds a pause when unfinished work needs your attention, without making you block your phone all day.</p>
          <p className="guide-byline">By <Link href="/">Nonlate</Link> · Published <time dateTime={firstGuide.date}>{firstGuide.displayDate}</time></p>
          <p className="guide-disclosure">This guide is published by the maker of Nonlate and explains our app’s approach. It is not an independent product comparison.</p>
        </header>

        <section className="guide-answer" id="quick-answer" aria-labelledby="answer-title">
          <h2 id="answer-title">The short answer</h2>
          <p>Use an app blocker that checks unfinished tasks, not just a timer. In <Link href="/">Nonlate</Link>, you choose distracting apps and a due-work window. When a selected app opens while an eligible task is overdue or due within that window, Nonlate blocks access with the presentation supported by your device.</p>
          <p>This is not a permanent lock until every task in your list is complete. Available break actions and your blocking settings still matter. Calendar events do not trigger blocking.</p>
          <DownloadLinks />
        </section>

        <nav className="guide-toc" aria-label="In this guide"><h2>In this guide</h2><ul>{sections.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ul></nav>

        <section id="setup">
          <h2>Set up deadline-aware blocking in Nonlate</h2>
          <ol className="guide-steps">
            <li><h3>Add the work that actually needs attention</h3><p>Create a task in Tasks and give it a realistic deadline. You can also connect a supported task service. Start with a manual task if you want to try blocking without connecting another account.</p></li>
            <li><h3>Choose a few distracting apps</h3><p>Open Settings, find App blocking, then choose Blocked apps. Select the apps you tend to open instead of starting work. Complete the permission steps Nonlate shows for your platform.</p></li>
            <li><h3>Choose when due work should interrupt you</h3><p>In Blocker settings, look for “Block when tasks are due within.” Choose the window that fits your day and make sure blocking is enabled. A task due next week should not be treated like a task due shortly unless your selected window includes it.</p></li>
            <li><h3>Make time to do the task</h3><p>Use <Link href="/#product">Planner and Schedule</Link> to choose when to work. Planning a task does not change its deadline, and a calendar event is not a blocking task.</p></li>
            <li><h3>Check the interruption and break settings</h3><p>Open one of your selected distracting apps while an unfinished task qualifies for blocking. Return to the work, or use a supported timed break when appropriate. Optional Focus Lock removes the quick-break button from the blocker; a break can still be started from Home inside Nonlate after a due-task check and reflection pause.</p></li>
          </ol>
          <p>Menu wording can vary with your app version and language. Keep essential communication, navigation and emergency tools accessible when choosing distractions to block.</p>
        </section>

        <section id="platforms">
          <h2>What changes between iPhone and Android?</h2>
          <p>The idea is the same—due work before selected distractions—but the operating systems allow different blocker screens.</p>
          <div className="guide-platforms">
            <figure><img src="/assets/screens/ios-blocker.png" alt="Nonlate’s iPhone Screen Time shield interrupting access to a selected distracting app" width="736" height="1600" loading="lazy" /><figcaption><strong>iPhone:</strong> Nonlate uses Apple Screen Time authorization and shields. The shield’s layout and available actions follow iOS restrictions.</figcaption></figure>
            <figure><img src="/assets/screens/android-blocker.png" alt="Nonlate’s Android blocker displaying unfinished due tasks and available actions" width="787" height="1400" loading="lazy" /><figcaption><strong>Android:</strong> Nonlate uses its Accessibility service to detect a selected app opening and can display a fuller blocker with task details. Follow the in-app permission explanation before enabling the service.</figcaption></figure>
          </div>
          <p>Neither version is intended as tamper-proof device management. Permissions, available break actions and operating-system settings affect what can be blocked. You remain in control of those settings.</p>
        </section>

        <section id="example">
          <h2>A practical example: a report due tonight</h2>
          <p>Suppose your report is due at 8 p.m. and you select a due-work window that includes it. You also choose a social app as a distraction. If the report is unfinished when you open that app, Nonlate can interrupt access.</p>
          <p>Putting a work session in Planner helps you decide when to start, but does not move the 8 p.m. deadline. Completing the report removes that task as a blocking reason. Another qualifying unfinished task can still keep blocking active; completing one task does not necessarily unlock every selected app.</p>
        </section>

        <section id="troubleshooting">
          <h2>If blocking does not appear</h2>
          <ul>
            <li><strong>Check the task:</strong> is it unfinished, eligible for blocking, and inside the selected due-work window? Check any task-specific app-blocking choice, too.</li>
            <li><strong>Check the app:</strong> is it in your selected blocked-app list, and is blocking switched on?</li>
            <li><strong>Check temporary access:</strong> an active break can allow access while tasks remain due.</li>
            <li><strong>Check permissions:</strong> iPhone needs Screen Time authorization; Android needs the required Accessibility permission. If access was revoked, follow the app’s setup again.</li>
            <li><strong>Check connected tasks:</strong> refresh Nonlate if a task changed in another service. Sync speed depends on the provider, plan, permissions and device background limits; it is not always instant.</li>
          </ul>
          <p>If the problem remains, <Link href="/support/">contact Nonlate support</Link> with your app version, device and the steps that led to it. Do not include passwords or private task content you do not want to share.</p>
        </section>

        <section id="questions" className="guide-questions">
          <h2>Common questions</h2>
          <h3>Can I try this without a subscription?</h3>
          <p>Yes. Nonlate’s Free plan includes manual tasks and core blocking for up to three distracting apps. No Nonlate account is required, and every plan is ad-free. Connecting an external source is optional and has separate trial and subscription limits. See the current <Link href="/#plans">plans and trial details</Link>; localized store prices and purchase terms apply.</p>
          <h3>Will it block apps whenever my calendar is busy?</h3>
          <p>No. Calendar events appear in Schedule but do not trigger blocking. Nonlate checks eligible unfinished tasks and their deadlines instead.</p>
          <h3>Is this the same as a daily screen-time limit?</h3>
          <p>No. A daily usage limit responds to how long you use an app. Nonlate’s deadline-aware blocking responds to unfinished due work. If you only need a fixed daily usage cap, your phone’s built-in screen-time controls may be enough.</p>
          <h3>Does blocking guarantee that I will finish my work?</h3>
          <p>No. Blocking adds friction before a distraction; it does not do the task for you. Pair it with a small next action and a realistic work session. Avoid treating an app as a guarantee of productivity.</p>
        </section>

        <aside className="guide-answer guide-closing" aria-labelledby="try-title">
          <h2 id="try-title">Try one task and one distraction</h2>
          <p>Start with a real deadline and one app you want to put aside. Nonlate brings your tasks, plan and deadline-aware blocking together on iPhone and Android.</p>
          <DownloadLinks />
          <p className="guide-disclosure">Free download with optional Plus and Pro subscriptions. Device compatibility and store availability vary by country.</p>
        </aside>
        <footer className="guide-notes"><h2>About this guide</h2><p>By Nonlate. Product instructions were checked against Nonlate’s iOS and Android settings and blocking rules for this publication. Screenshots show platform examples; your theme and app version may differ.</p><p>For more details, see <Link href="/#moment">how Nonlate works</Link>, <Link href="/#faq">product questions</Link> and our <Link href="/privacy/">privacy policy</Link>.</p></footer>
      </article>
      <Link className="guide-back" href="/guides/">← All guides</Link>
    </>
  );
}
