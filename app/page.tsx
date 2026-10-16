"use client";

/* eslint-disable @next/next/no-img-element -- local product art is pre-sized and the gallery is lazy-loaded */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { MascotVignette } from "./components/MascotVignette";
import {
  appStoreUrl,
  playStoreUrl,
  demoPhases,
  faqEntries,
  previewIntegrations,
  integrationGroups,
  planTiers,
  type Platform,
} from "./site-data";

const demoTasks = [
  { title: "Submit biology lab", due: "Overdue", source: "Canvas", icon: "/assets/integrations/canvas.png", urgent: true },
  { title: "Project outline", due: "Due in 2h", source: "Notion", icon: "/assets/integrations/notion.png" },
  { title: "Team brief", due: "Due today", source: "Slack", icon: "/assets/integrations/slack.png" },
];

const screenGallery = [
  { src: "/assets/screens/ios-home.png", alt: "Nonlate iOS Home showing overdue and upcoming tasks from connected sources", platform: "iOS", label: "Home · due tasks" },
  { src: "/assets/screens/ios-planner.png", alt: "Nonlate iOS Planner assigning upcoming tasks to a chosen day", platform: "iOS", label: "Planner · choose a day" },
  { src: "/assets/screens/android-schedule.png", alt: "Nonlate Android Schedule arranging planned work, tasks, events, classes, and shifts by time", platform: "Android", label: "Schedule · timed day" },
  { src: "/assets/screens/android-insights.png", alt: "Nonlate Android Insights showing Focus Pulse, streaks, focus rhythm, and recovery", platform: "Android", label: "Insights · Focus Pulse" },
];

function SourcePill({ icon, label, note }: { icon: string; label: string; note?: string }) {
  return (
    <span className="source-pill">
      <img src={icon} alt="" width="24" height="24" />
      <span>{label}</span>
      {note ? <small>{note}</small> : null}
    </span>
  );
}

function MiniTask({ task, compact = false }: { task: (typeof demoTasks)[number]; compact?: boolean }) {
  return (
    <div className={`mini-task${task.urgent ? " is-urgent" : ""}${compact ? " is-compact" : ""}`}>
      <img src={task.icon} alt="" width="32" height="32" />
      <span>
        <strong>{task.title}</strong>
        <small>{task.source}</small>
      </span>
      <em>{task.due}</em>
    </div>
  );
}

function BlockerCapture({ platform }: { platform: Platform }) {
  const isIOS = platform === "ios";
  return (
    <figure className={`blocker-capture blocker-capture-${platform}`}>
      <div className="capture-label"><span>{isIOS ? "iOS" : "Android"}</span>Actual blocker screen</div>
      <div className="capture-frame">
        <img
          src={`/assets/screens/${platform}-blocker.png`}
          alt={isIOS ? "Actual Nonlate iOS blocker screen" : "Actual Nonlate Android blocker screen"}
          width={isIOS ? "736" : "787"}
          height={isIOS ? "1600" : "1400"}
          fetchPriority="high"
        />
      </div>
      <figcaption>{isIOS ? "iOS" : "Android"} blocker example</figcaption>
    </figure>
  );
}

function DualPhoneDemo() {
  return (
    <div className="dual-phone-stage">
      <div className="stage-halo" aria-hidden="true" />
      <div className="floating-chip chip-sync"><img src="/assets/integrations/google_calendar.png" alt="" /> your tools, <b>together</b></div>
      <div className="floating-chip chip-overdue"><img src="/assets/integrations/canvas.png" alt="" /> <b>1 overdue</b></div>
      <BlockerCapture platform="ios" />
      <BlockerCapture platform="android" />
    </div>
  );
}

function InterceptDialog({ onClose, onViewTasks, onBreak }: { onClose: () => void; onViewTasks: () => void; onBreak: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])"));
    focusable[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="intercept-veil" role="presentation">
      <div className="intercept-dialog" role="dialog" aria-modal="true" aria-labelledby="intercept-title" aria-describedby="intercept-description" ref={dialogRef}>
        <button className="dialog-close" type="button" onClick={onClose} aria-label="Close interactive demo">×</button>
        <p className="dialog-badge"><span /> Interactive demo · Nonlate stepped in</p>
        <p className="dialog-progress">You opened a distraction while three tasks were due.</p>
        <h2 id="intercept-title">Your next deadline beats the feed.</h2>
        <p id="intercept-description">Website demo: these sample tasks are not real and nothing is changed. In the app, Nonlate would show your overdue and upcoming work here.</p>
        <div className="dialog-tasks">{demoTasks.map((task) => <MiniTask key={task.title} task={task} />)}</div>
        <div className="dialog-actions">
          <button className="button-primary" type="button" onClick={onViewTasks}>View tasks <span>→</span></button>
          <button className="button-secondary" type="button" onClick={onBreak}>Take a 10-minute break</button>
        </div>
        <p className="dialog-footnote">“View tasks” closes this website demo without moving the page.</p>
      </div>
    </div>
  );
}

function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function getSavedBreakSeconds() {
  if (typeof window === "undefined") return 0;
  const saved = Number(window.sessionStorage.getItem("nonlate-demo-break-until") || 0);
  return saved > Date.now() ? Math.ceil((saved - Date.now()) / 1000) : 0;
}

function subscribeMotionPreference(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// The static page and its first client render agree. Films stay still until the
// browser preference is known, including when opening a film section directly.
const getServerMotionPreference = () => true;

export default function Home() {
  const reducedMotion = useSyncExternalStore(
    subscribeMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  );
  const [interceptOpen, setInterceptOpen] = useState(false);
  const [breakLeft, setBreakLeft] = useState(getSavedBreakSeconds);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mainShellRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        setScrollProgress(Math.min(100, Math.round((window.scrollY / max) * 100)));
        queued = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const expiry = Number(window.sessionStorage.getItem("nonlate-demo-break-until") || 0);
      if (expiry <= 0) return;
      const next = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setBreakLeft(next);
      if (next === 0) window.sessionStorage.removeItem("nonlate-demo-break-until");
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const root = mainShellRef.current;
    if (!root) return;
    let focusTimer = 0;
    root.inert = interceptOpen;
    document.body.classList.toggle("dialog-open", interceptOpen);
    if (!interceptOpen) {
      focusTimer = window.setTimeout(() => lastFocusedRef.current?.focus({ preventScroll: true }), 0);
    }
    return () => {
      window.clearTimeout(focusTimer);
      root.inert = false;
      document.body.classList.remove("dialog-open");
    };
  }, [interceptOpen]);

  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.remove("reveal-ready");
      return;
    }
    document.documentElement.classList.add("reveal-ready");
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
      { rootMargin: "0px 0px -12%", threshold: 0.08 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("reveal-ready");
    };
  }, [reducedMotion]);

  const openIntercept = useCallback((event?: ReactMouseEvent<HTMLButtonElement>) => {
    lastFocusedRef.current = event?.currentTarget ?? (document.activeElement as HTMLElement | null);
    setInterceptOpen(true);
  }, []);
  const closeIntercept = useCallback(() => setInterceptOpen(false), []);
  const viewTasks = useCallback(() => {
    setInterceptOpen(false);
  }, []);
  const startBreak = useCallback(() => {
    const expiry = Date.now() + 10 * 60 * 1000;
    window.sessionStorage.setItem("nonlate-demo-break-until", String(expiry));
    setBreakLeft(600);
    setInterceptOpen(false);
  }, []);
  const endBreak = useCallback(() => {
    window.sessionStorage.removeItem("nonlate-demo-break-until");
    setBreakLeft(0);
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://nonlate.app/#organization",
        name: "Nonlate",
        url: "https://nonlate.app/",
        logo: "https://nonlate.app/assets/brand/icon-512.png",
      },
      {
        "@type": "WebSite",
        "@id": "https://nonlate.app/#website",
        name: "Nonlate",
        url: "https://nonlate.app/",
        publisher: { "@id": "https://nonlate.app/#organization" },
        about: { "@id": "https://nonlate.app/#software" },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://nonlate.app/#software",
        name: "Nonlate",
        alternateName: "Nonlate App",
        url: "https://nonlate.app/",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: ["iOS", "Android"],
        description: "Nonlate combines manual and synced deadlines, helps you plan and schedule them, and blocks selected distractions when work is due.",
        publisher: { "@id": "https://nonlate.app/#organization" },
        image: "https://nonlate.app/assets/brand/icon-512.png",
        downloadUrl: [appStoreUrl, playStoreUrl],
        installUrl: [appStoreUrl, playStoreUrl],
        screenshot: screenGallery.map((screen) => `https://nonlate.app${screen.src}`),
        featureList: [
          "Manual tasks and connected-source deadlines",
          "Deadline-aware blocking of selected distractions",
          "Daily Planner and timed Schedule",
          "Widgets and supported iOS Live Activities",
          "Custom intercept messages and Daily Wisdom",
          "Themes and Focus Pulse insights",
        ],
        offers: { "@type": "Offer", name: "Free download with optional Plus and Pro subscriptions", price: "0", priceCurrency: "USD", url: "https://nonlate.app/#plans" },
      },
      {
        "@type": "FAQPage",
        "@id": "https://nonlate.app/#faq",
        mainEntity: faqEntries.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: { "@type": "Answer", text: entry.answer },
        })),
      },
    ],
  };

  return (
    <>
      <div className="scroll-meter" aria-hidden="true"><span style={{ width: `${scrollProgress}%` }} /></div>
      <div id="site-shell" ref={mainShellRef}>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content">
          <section className="hero section-shell" aria-labelledby="hero-title">
            <div className="hero-copy" data-reveal>
              <div className="mascot-banner">
                <img src="/assets/mascots/peek.png" alt="" width="96" height="96" />
                <p>From all over the place.<br /><strong>To one place.</strong></p>
              </div>
              <h1 id="hero-title">More connected.<strong>Less distracted.</strong></h1>
              <p className="hero-support">Stay ahead of what’s due.</p>
              <p className="hero-lede">Your tasks, deadlines, and plans—together. Nonlate connects the tools you already use and steps in when a chosen distraction gets ahead of unfinished work.</p>
              <div className="hero-actions">
                <a className="button-primary store-download" href={appStoreUrl}><span aria-hidden="true">↗</span> Download for iOS</a>
                <a className="button-secondary store-download" href={playStoreUrl}><span aria-hidden="true">↗</span> Get it on Android</a>
              </div>
              <p className="hero-free-note">Start free. No Nonlate account required. <a href="#plans">See plans →</a></p>
              <dl className="hero-stats" aria-label="Product highlights">
                <div><dt>Connect</dt><dd>School, work, tasks & calendars</dd></div>
                <div><dt>Plan</dt><dd>One clear view of your day</dd></div>
                <div><dt>Focus</dt><dd>Deadlines before distractions</dd></div>
              </dl>
            </div>

            <div className="hero-demo" data-reveal>
              <DualPhoneDemo />
            </div>
          </section>

          <section className="integration-preview section-shell" aria-labelledby="integration-preview-title">
            <div className="integration-preview-heading">
              <h2 id="integration-preview-title">Works with your tools</h2>
            </div>
            <div className="integration-preview-window" tabIndex={0} role="region" aria-label="All integrations. Automatically scrolling; use arrow keys to explore.">
              <div className="integration-preview-track">
                <ul className="integration-preview-list" aria-label="Supported integration services">
                  {previewIntegrations.map((item) => (
                    <li key={item.name}><SourcePill icon={item.icon} label={item.name} note={item.platformNote} /></li>
                  ))}
                </ul>
                <ul className="integration-preview-list integration-preview-copy" aria-hidden="true">
                  {previewIntegrations.map((item) => (
                    <li key={item.name}><SourcePill icon={item.icon} label={item.name} note={item.platformNote} /></li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <div className="launch-strip section-shell">
            <p>Made for your real day.<span> School. Work. Everything in between.</span></p>
          </div>

          <section className="moment section-shell" id="moment" aria-labelledby="moment-title">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span /> A little help at the right moment</p>
              <h2 id="moment-title">Before the feed.<br />What needs you?</h2>
              <p>Choose the distractions Nonlate can interrupt. When work is due, your next task gets the first word.</p>
              <button type="button" className="button-primary demo-launch" onClick={openIntercept}>Try the blocker demo <span aria-hidden="true">↗</span></button>
              <small className="demo-disclaimer">Just a website preview. Nothing on your device is blocked.</small>
            </div>
            <div className="moment-visual" data-reveal>
              <span className="film-orbit" aria-hidden="true" />
              <MascotVignette
                id="distraction-film"
                src="/assets/films/outrun-distraction.mp4"
                poster="/assets/films/outrun-distraction.jpg"
                title="Meet the little nudge."
                description="A tiny teammate steps between a wandering phone and the next scroll."
                reducedMotion={reducedMotion}
              />
              <p className="film-side-note"><span aria-hidden="true">✦</span> A little character.<br /><strong>A clearer boundary.</strong></p>
            </div>
            <ol className="moment-steps">
              {demoPhases.map((item, index) => (
                <li key={item.id} data-reveal>
                  <span>0{index + 1}</span>
                  <div><h3>{item.title}</h3><p>{item.description}</p></div>
                </li>
              ))}
            </ol>
            <p className="moment-note">Only unfinished due tasks trigger blocking—not calendar events. Want a firmer boundary? Optional Focus Lock moves quick breaks back into Nonlate.</p>
          </section>

          <section className="product-section section-shell" id="product" aria-labelledby="product-title">
            <div className="section-heading centered" data-reveal>
              <p className="eyebrow"><span /> One connected system</p>
              <h2 id="product-title">Less juggling.<br />More doing.</h2>
              <p>Keep what’s due, what’s planned, and what needs your focus working together.</p>
            </div>
            <div className="bento-grid">
              <article className="bento-card bento-tasks" id="tasks" data-reveal>
                <p className="card-index">01 · CONNECT</p><h3>One place for what’s due.</h3><p>Add your own tasks or connect your existing tools. See overdue work first and upcoming deadlines next.</p>
                <div className="bento-visual task-preview">{demoTasks.map((task) => <MiniTask task={task} key={task.title} />)}</div>
              </article>
              <article className="bento-card bento-planner" data-reveal>
                <p className="card-index">02 · PLAN</p><h3>Make room for the work.</h3><p>Choose a day in Planner. Then see planned work, deadlines, events, classes, and shifts together in Schedule.</p>
                <div className="planner-preview" aria-label="Planner preview with chosen days, today’s plan, and an upcoming task">
                  <div className="planner-preview-head"><strong>Choose a day</strong><small>Swipe for later dates</small></div>
                  <div className="planner-days"><b>Sun<strong>5</strong></b><span>Mon<strong>6</strong></span><span>Tue<strong>7</strong></span><span>Wed<strong>8</strong></span></div>
                  <div className="planner-list-head"><strong>Today’s plan <span>2</span></strong><small>Tap + to add to plan</small></div>
                  <div className="planned-task"><i /><span><strong>Project outline</strong><small>in 1 hour</small></span><b>↩</b></div>
                  <div className="planned-task"><i /><span><strong>Team brief</strong><small>in 3 hours</small></span><b>↩</b></div>
                  <div className="planner-list-head planner-upcoming-head"><strong>Upcoming tasks</strong><small>Keep the day above</small></div>
                  <div className="planned-task planner-upcoming-task"><i /><span><strong>Read chapter 8</strong><small>in 18 hours</small></span><b>Drag</b></div>
                </div>
              </article>
              <article className="bento-card bento-protect" data-reveal>
                <p className="card-index">03 · FOCUS</p><h3>A nudge before the scroll.</h3><p>Your chosen distractions can wait. See the work that needs attention, then choose the task or supported break action.</p>
                <div className="app-orbits" aria-label="Examples of social and entertainment apps you can protect">
                  <span className="orbit-center"><img src="/assets/nonlate-icon.png" alt="Nonlate" /><small>Nonlate</small></span>
                  <span className="app-dot app-youtube"><img src="/assets/distractions/youtube.svg" alt="YouTube" /></span>
                  <span className="app-dot app-tiktok"><img src="/assets/distractions/tiktok.svg" alt="TikTok" /></span>
                  <span className="app-dot app-instagram"><img src="/assets/distractions/instagram.svg" alt="Instagram" /></span>
                  <span className="app-dot app-snapchat"><img src="/assets/distractions/snapchat.svg" alt="Snapchat" /></span>
                  <span className="app-dot app-reddit"><img src="/assets/distractions/reddit.svg" alt="Reddit" /></span>
                  <span className="app-dot app-x"><img src="/assets/distractions/x.svg" alt="X" /></span>
                  <span className="app-dot app-facebook"><img src="/assets/distractions/facebook.svg" alt="Facebook" /></span>
                </div>
              </article>
            </div>
            <div className="included-row">
              <article><span aria-hidden="true">↗</span><div><h3>A reminder with more presence.</h3><p>Can’t Miss Alarms use the strongest alarm presentation supported by your device.</p></div></article>
              <article><span aria-hidden="true">◷</span><div><h3>Your next deadline, in sight.</h3><p>Widgets and supported iPhone Live Activities keep the next step close.</p></div></article>
            </div>
          </section>

          <section className="integrations-section section-shell" id="integrations" aria-labelledby="integrations-title">
            <div className="integration-intro">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span /> Integrations</p>
              <h2 id="integrations-title">Your tools.<br />Finally on the same page.</h2>
              <p>Keep using the services you love. Bring supported tasks and due dates into Nonlate without entering them twice.</p>
            </div>
            <div className="wildlife-film" data-reveal>
              <MascotVignette
                id="deadline-film"
                src="/assets/films/deadline-in-the-wild.mp4"
                poster="/assets/films/deadline-in-the-wild.jpg"
                title="Catch it before “later.”"
                description="Our little deadline hunter catches a task before it disappears into Later. Your work stays yours to complete."
                reducedMotion={reducedMotion}
              />
            </div>
            </div>
            <div className="integration-grid">
              {integrationGroups.map((group) => (
                <article className={`integration-group accent-${group.accent}`} key={group.title} data-reveal>
                  <h3><span />{group.title}</h3>
                  <div>{group.items.map((item) => <SourcePill key={item.name} icon={item.icon} label={item.name} note={item.platformNote} />)}</div>
                </article>
              ))}
            </div>
            <p className="section-note">Source availability, permissions, and sync speed vary by provider, platform, and plan. Imported calendar events appear in Schedule, but they are not due tasks and never trigger blocking.</p>
          </section>

          <section className="real-screens section-shell" aria-labelledby="screens-title">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span /> Made for your phone</p>
              <h2 id="screens-title">A clearer day.<br />A real app.</h2>
              <p>Actual iOS and Android screens, with platform-native details. Swipe through a few everyday views.</p>
            </div>
            <div className="screen-rail" role="region" aria-label="Actual app screenshots. Scroll horizontally to explore." tabIndex={0}>
              {screenGallery.map((screen) => (
                <figure key={screen.src} data-reveal>
                  <div className="screen-meta"><span>{screen.platform}</span><strong>{screen.label}</strong></div>
                  <img src={screen.src} alt={screen.alt} loading="lazy" width="660" height={screen.platform === "iOS" ? "1434" : "1173"} />
                </figure>
              ))}
            </div>
          </section>

          <section className="personal-section section-shell" aria-labelledby="personal-title">
            <div className="section-heading centered" data-reveal>
              <p className="eyebrow"><span /> Personal by design</p>
              <h2 id="personal-title">A little more you.</h2>
              <p>Make the experience yours, from your colors to the words that bring you back.</p>
            </div>
            <div className="personal-grid">
              <article data-reveal><span className="personal-number">01</span><h3>Choose the message that stops you.</h3><p>On supported blocker screens, use the standard deadline prompt, write a custom message, or rotate Daily Wisdom in the tone you need.</p><div className="message-preview"><small>TODAY’S MESSAGE</small><blockquote>“Start smaller than your excuses.”</blockquote><span>Daily wisdom · Calm</span></div></article>
              <article data-reveal><span className="personal-number">02</span><h3>See your Focus Pulse.</h3><p>See on-time and missed due-work days, current and best streaks, your strongest weekdays, and how quickly you get back on track after a miss.</p><div className="pulse-preview"><div><span className="pulse-score"><strong>82</strong><small>FOCUS PULSE</small></span></div><span><b>5</b> current</span><span><b>12</b> best</span><span><b>1.4d</b> recover</span></div></article>
              <article data-reveal><span className="personal-number">03</span><h3>Make focus feel yours.</h3><p>Choose one of 12 built-in themes or create custom colors. Your selected theme carries through the app and supported widgets.</p><div className="theme-preview"><span className="theme-aurora">Aurora</span><span className="theme-bloom">Bloom</span><span className="theme-sage">Sage</span><span className="theme-boring">Boring</span><div className="theme-more"><div className="theme-more-swatches" aria-hidden="true"><i className="swatch-nightfall" /><i className="swatch-sky" /><i className="swatch-golden" /><i className="swatch-berry" /></div><p><strong>+8 more themes</strong><small>Custom colors too</small></p></div></div></article>
            </div>
          </section>

          <section className="plans-section section-shell" id="plans" aria-labelledby="plans-title">
            <div className="section-heading centered" data-reveal>
              <p className="eyebrow"><span /> A plan for every level of focus</p>
              <h2 id="plans-title">Start free.<br />Connect more when you’re ready.</h2>
              <p>Manual tasks and core blocking stay free. Plus adds more connections and personalization. Pro brings everything together.</p>
            </div>
            <div className="plans-grid">
              {planTiers.map((plan) => (
                <article className={`plan-card${plan.highlighted ? " is-highlighted" : ""}`} key={plan.name} data-reveal>
                  {plan.highlighted ? <span className="plan-badge">Best for most people</span> : null}
                  <p>{plan.eyebrow}</p><h3>{plan.name}</h3><strong>{plan.price}</strong>
                  {plan.annualPrice ? <span className="plan-annual-price">or {plan.annualPrice}, billed annually</span> : null}
                  <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
                  <a className="plan-status" href="#coming-soon">Choose your plan in the app <span aria-hidden="true">↗</span></a>
                </article>
              ))}
            </div>
            <p className="section-note">Eligible subscribers can try Plus free for 7 days on Monthly or Yearly. After the trial, the selected paid plan renews automatically unless cancelled. Eligibility, the full localized renewal price, and the billing period are confirmed in your app store before subscribing.</p>
            <p className="section-note">Prices shown are USD reference prices; prices and availability may vary by region and platform. Manage or cancel subscriptions in the purchasing store. Features and sync timing vary by provider and device.</p>
            <p className="section-note">The source trial starts after your first successful connection, has no automatic charge, and does not restart when you switch sources. After 30 days, external syncing pauses; imported tasks remain available for local completion and blocking. Manual tasks and on-device calendars and reminders stay free.</p>
          </section>

          <section className="privacy-section section-shell" id="privacy" aria-labelledby="privacy-title">
            <div className="privacy-copy" data-reveal>
              <p className="eyebrow"><span /> Privacy by design</p>
              <h2 id="privacy-title">Connected data is for your deadlines.</h2>
              <p>Nonlate processes task and calendar details only for services you choose to connect, stores credentials using platform-secure storage, and lets you disconnect sources or request deletion.</p>
              <a className="text-action" href="/privacy/">Read the full privacy policy <span>→</span></a>
            </div>
            <div className="privacy-points">
              <article data-reveal><span>01</span><div><h3>Protected in transit and at rest</h3><p>HTTPS/TLS in transit, Keychain on iOS, and Keystore-backed encrypted preferences on Android.</p></div></article>
              <article data-reveal><span>02</span><div><h3>Limited use of Google data</h3><p>Google task and calendar data is used only to provide connected sync and Nonlate features, not advertising or generalized AI training.</p></div></article>
              <article data-reveal><span>03</span><div><h3>Your connections stay reversible</h3><p>Disconnect a source in Nonlate settings or request deletion through support at any time.</p></div></article>
            </div>
          </section>

          <section className="faq-section section-shell" id="faq" aria-labelledby="faq-title">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span /> Questions, answered plainly</p>
              <h2 id="faq-title">Before Nonlate steps in.</h2>
              <p>Clear answers, so you know what to expect.</p>
            </div>
            <div className="faq-list">
              {faqEntries.map((entry) => <details key={entry.question} data-reveal><summary>{entry.question}<span>+</span></summary><p>{entry.answer}</p></details>)}
            </div>
          </section>

          <section className="closing-section section-shell" id="coming-soon" aria-labelledby="closing-title" data-reveal>
            <div className="closing-glow" aria-hidden="true" />
            <img className="closing-mascot" src="/assets/mascots/victory.png" alt="" width="192" height="192" loading="lazy" />
            <p className="eyebrow"><span /> From all over the place. To one place.</p>
            <h2 id="closing-title">Your day.<br />Back in your hands.</h2>
            <p>Stay ahead of what’s due. Start free on iOS or Android, with no Nonlate account required.</p>
            <div className="platform-statuses" aria-label="Download Nonlate"><a href={appStoreUrl}><b>Download for iOS</b><small>App Store ↗</small></a><a href={playStoreUrl}><b>Get it on Android</b><small>Google Play ↗</small></a></div>
            <a className="text-action" href="/support/">Questions? We’re here to help <span>→</span></a>
          </section>
        </main>
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </div>

      {interceptOpen ? <InterceptDialog onClose={closeIntercept} onViewTasks={viewTasks} onBreak={startBreak} /> : null}
      {breakLeft > 0 ? (
        <div className="break-pill" role="status">
          <span className="break-dot" aria-hidden="true" />
          <span><small>DEMO BREAK ACTIVE</small><strong>{formatClock(breakLeft)}</strong></span>
          <button type="button" onClick={endBreak}>End break</button>
        </div>
      ) : null}
    </>
  );
}
