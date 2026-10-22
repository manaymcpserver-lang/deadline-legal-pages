import type { Metadata } from "next";
import Link from "next/link";
import { appStoreUrl, playStoreUrl } from "../../site-data";
import { firstGuide, planningGuide as guide } from "../guide-data";
import { GuideLanguages, guideAlternates } from "../GuideLanguages";
import planningLocales from "../planning-locales.json";

export const metadata: Metadata = {
  title: guide.title,
  description: guide.description,
  alternates: { canonical: guide.href, languages: guideAlternates(true, guide.href, planningLocales) },
  authors: [{ name: "Nonlate", url: "https://nonlate.app/" }],
  openGraph: {
    type: "article", title: guide.title, description: guide.description,
    url: guide.href, publishedTime: guide.date, modifiedTime: guide.date,
    authors: ["Nonlate"], images: ["/og.png"],
  },
  twitter: { card: "summary_large_image", title: guide.title, description: guide.description, images: ["/og.png"] },
};

const sections = [
  ["deadline-and-plan", "Separate the deadline from the work session"],
  ["one-place", "Bring the work into one place"],
  ["realistic-session", "Choose a realistic session"],
  ["distractions", "Use blocking as a reminder to follow through"],
  ["reset", "Reset when the day changes"],
] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article", headline: guide.title, description: guide.description,
      mainEntityOfPage: `https://nonlate.app${guide.href}`,
      datePublished: guide.date, dateModified: guide.date, inLanguage: "en",
      author: { "@type": "Organization", name: "Nonlate", url: "https://nonlate.app/" },
      publisher: { "@type": "Organization", name: "Nonlate", url: "https://nonlate.app/" },
      image: "https://nonlate.app/og.png",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://nonlate.app/" },
        { "@type": "ListItem", position: 2, name: "Guides", item: "https://nonlate.app/guides/" },
        { "@type": "ListItem", position: 3, name: guide.title, item: `https://nonlate.app${guide.href}` },
      ],
    },
  ],
};

export default function PlanningGuide() {
  return (
    <>
      <GuideLanguages article articleHref={guide.href} availableLocales={planningLocales} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <nav className="guide-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides/">Guides</Link><span aria-hidden="true">/</span><span aria-current="page">Planning your work</span></nav>
      <article className="guide-article">
        <header className="guides-heading">
          <p className="eyebrow"><span /> Planning · School, work &amp; everyday life</p>
          <h1>{guide.title}</h1>
          <p>“Due Friday” tells you when the work must be finished. It does not tell you what to do on Tuesday afternoon. That gap is where a task can sit untouched while the week fills up.</p>
          <p className="guide-byline">By <Link href="/">Nonlate</Link> · Published <time dateTime={guide.date}>{guide.displayDate}</time></p>
          <p className="guide-disclosure">This guide is published by the maker of Nonlate. It explains a practical workflow, not a guarantee that an app will finish your work for you.</p>
        </header>

        <section className="guide-answer" aria-labelledby="short-answer">
          <h2 id="short-answer">The short answer</h2>
          <p>Keep the real deadline, then choose a separate time to work on the task. Start with a small session you can actually keep. In Nonlate, use Tasks for the work and its deadline, Planner to plan a session, and Schedule to see how that session fits around your day.</p>
          <p>Your plan uses the task’s name. You do not need to invent a separate plan title, and scheduling a session does not change the task’s deadline.</p>
        </section>

        <nav className="guide-toc" aria-label="In this guide"><h2>In this guide</h2><ul>{sections.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ul></nav>

        <section id="deadline-and-plan">
          <h2>1. Separate the deadline from the work session</h2>
          <p>Imagine an essay due Friday at 5 p.m. Leave Friday at 5 p.m. as the deadline. Then plan time for that essay on Tuesday afternoon, when you have room to begin. The session appears under the essay task’s name.</p>
          <p>Before starting, decide on one concrete next action, such as opening the assignment brief and outlining the first argument. That is a way to approach the session, not a separate name you have to give the plan.</p>
          <p>The same distinction works for a report, a job application or a household task. “When must this be done?” and “When will I work on it?” are different questions.</p>
        </section>

        <section id="one-place">
          <h2>2. Bring the work into one place without rebuilding your setup</h2>
          <p>Add a manual task, or connect a supported source in Nonlate’s integration settings. School tasks might come from Canvas or Moodle; work might already live in Notion, Todoist or Google Tasks. You can keep using the original service while bringing supported task information into Nonlate.</p>
          <p>Check the imported deadline before planning around it. Available fields and sync timing depend on the provider, permissions, plan and device. A change in another app may not appear immediately.</p>
          <p>Calendar connections help you see commitments in Schedule. Calendar events do not trigger blocking, and a busy calendar is not the same as an unfinished task.</p>
        </section>

        <section id="realistic-session">
          <h2>3. Choose a session that fits the day you actually have</h2>
          <ol className="guide-steps">
            <li><h3>Pick the task</h3><p>Start with one important unfinished task, rather than trying to schedule your whole list at once.</p></li>
            <li><h3>Check your available time</h3><p>Look at Schedule for classes, meetings and other commitments. Leave room for travel, meals and the ordinary gaps between activities.</p></li>
            <li><h3>Plan time in Planner</h3><p>Choose when to work on that task and a duration you can realistically protect. Menu wording can vary by app version. The resulting plan is based on the task’s name.</p></li>
            <li><h3>Keep a little margin</h3><p>A first session is not a promise that the entire task will be finished. Leave time before the actual deadline for the work you discover along the way.</p></li>
          </ol>
        </section>

        <section id="distractions">
          <h2>4. Add friction before the automatic scroll</h2>
          <p>A plan can still lose to a familiar habit: open your phone, tap a social app, and forget why you picked it up. Nonlate’s deadline-aware blocking can interrupt selected distracting apps when an eligible unfinished task is overdue or inside your chosen due-work window.</p>
          <p>Planning a session is not, by itself, a command to block every distraction during that session. The task’s deadline and your blocking settings determine whether due-work blocking applies. If you need a fixed time-of-day restriction, do not assume a planned session creates one.</p>
          <p>You can return to the task or use an available timed break. Marking a task complete removes it as a blocking reason; another qualifying unfinished task can still keep blocking active. Nonlate does not verify that an assignment was submitted or that the underlying work was actually done.</p>
          <p>For permission setup, platform differences and troubleshooting, read <Link href={firstGuide.href}>how to block distracting apps until your tasks are done</Link>. Keep essential communication and emergency tools accessible.</p>
        </section>

        <section id="reset">
          <h2>5. Reset the plan when the day changes</h2>
          <p>If Tuesday afternoon gets taken over by something urgent, revisit the session. Choose another realistic time instead of changing Friday’s real deadline just to make the list look less urgent.</p>
          <p>At the end of a session, ask what is actually finished and what remains. Keep unfinished work visible. When a connected task changes, check its current state and allow for the provider’s sync behavior.</p>
          <p>The goal is not a perfectly packed calendar. It is knowing which task you will return to next, when you have time for it, and which distractions you want to put aside.</p>
        </section>

        <aside className="guide-answer guide-closing" aria-labelledby="try-it">
          <h2 id="try-it">Try it with one task this week</h2>
          <p>Choose a real deadline, plan one manageable session before it, and select one distracting app you want to interrupt when due work needs attention.</p>
          <div className="guide-downloads"><a className="guide-read-link" href={appStoreUrl}>Get Nonlate for iPhone ↗</a><a className="guide-read-link" href={playStoreUrl}>Get Nonlate for Android ↗</a></div>
          <p className="guide-disclosure">Connections, sync behavior and blocking controls vary by platform and plan. See <Link href="/#plans">current plans</Link> or <Link href="/support/">contact support</Link> for setup help.</p>
        </aside>
      </article>
      <Link className="guide-back" href="/guides/">← All guides</Link>
    </>
  );
}
