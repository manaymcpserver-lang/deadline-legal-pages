"use client";

/* eslint-disable @next/next/no-img-element -- local product art is pre-sized and the gallery is lazy-loaded */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import {
  blockingBehavior,
  demoPhases,
  faqEntries,
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
  { src: "/assets/screens/ios-tasks.png", alt: "Nonlate iOS task list showing Canvas, Notion, Slack, and Google Tasks work with different dates and times", platform: "iOS", label: "Tasks · every source" },
  { src: "/assets/screens/android-blocker.png", alt: "Nonlate Android blocker showing the overdue and upcoming work that triggered it", platform: "Android", label: "Blocker · work due" },
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
      <figcaption>Actual current {isIOS ? "iOS" : "Android"} blocker capture</figcaption>
    </figure>
  );
}

function DualPhoneDemo() {
  return (
    <div className="dual-phone-stage">
      <div className="stage-halo" aria-hidden="true" />
      <div className="floating-chip chip-sync"><img src="/assets/integrations/google_calendar.png" alt="" /> synced <b>now</b></div>
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
          <button className="button-secondary" type="button" onClick={onBreak}>Start a 10-minute demo break</button>
        </div>
        <p className="dialog-footnote">“View tasks” closes this website demo without moving the page. Press Esc to dismiss or replay it anytime.</p>
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

export default function Home() {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [interceptOpen, setInterceptOpen] = useState(false);
  const [breakLeft, setBreakLeft] = useState(getSavedBreakSeconds);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mainShellRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(media.matches);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        setScrollProgress(Math.min(100, Math.round((window.scrollY / max) * 100)));
        const seen = window.sessionStorage.getItem("nonlate-intercept-seen-v1");
        if (!seen && !reducedMotion && window.scrollY > window.innerHeight * 2.4) {
          window.sessionStorage.setItem("nonlate-intercept-seen-v1", "1");
          lastFocusedRef.current = document.activeElement as HTMLElement | null;
          setInterceptOpen(true);
        }
        queued = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reducedMotion]);

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
    window.sessionStorage.setItem("nonlate-intercept-seen-v1", "1");
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

  const marqueeSources = useMemo(() => integrationGroups.flatMap((group) => group.items).slice(0, 12), []);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Nonlate",
        url: "https://nonlate.app/",
        applicationCategory: "ProductivityApplication",
        operatingSystem: "iOS, Android",
        description: "Nonlate combines manual and synced deadlines, helps you plan and schedule them, and blocks selected distractions when work is due.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
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
              <p className="eyebrow"><span /> Deadlines before distractions</p>
              <h1 id="hero-title">Know what’s due <strong>before you scroll.</strong></h1>
              <p className="hero-lede">Nonlate combines tasks you add yourself with deadlines synced from school, calendar, to-do, and work apps. If you open a chosen distraction while work is due, Nonlate shows the blocker first.</p>
              <div className="hero-actions">
                <a className="button-primary" href="#moment">See Nonlate step in <span>↓</span></a>
                <span className="coming-note"><i /><i /> Coming soon to iOS and Android</span>
              </div>
              <dl className="hero-stats" aria-label="Product highlights">
                <div><dt>20+</dt><dd>school, work, calendar, and task sources</dd></div>
                <div><dt>Block</dt><dd>selected distractions only when work is due</dd></div>
                <div><dt>Both</dt><dd>platform-specific iOS and Android blockers</dd></div>
              </dl>
            </div>

            <div className="hero-demo" data-reveal>
              <DualPhoneDemo />
            </div>
          </section>

          <div className="source-marquee" aria-label="Examples of supported sources">
            <div className="marquee-track">
              {[...marqueeSources, ...marqueeSources].map((source, index) => <SourcePill key={`${source.name}-${index}`} icon={source.icon} label={source.name} />)}
            </div>
          </div>

          <section className="moment section-shell" id="moment" aria-labelledby="moment-title">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span /> The Nonlate moment</p>
              <h2 id="moment-title">The distraction arrives second.</h2>
              <p>Choose which distracting apps to protect. When one opens, Nonlate checks unfinished due work and shows the blocker only when something needs your attention.</p>
              <button type="button" className="text-action" onClick={openIntercept}>Replay the intercept demo <span>↗</span></button>
            </div>
            <ol className="moment-steps">
              {demoPhases.map((item, index) => (
                <li key={item.id} data-reveal>
                  <span>0{index + 1}</span>
                  <div><h3>{item.title}</h3><p>{item.description}</p></div>
                </li>
              ))}
            </ol>
          </section>

          <section className="product-section section-shell" id="product" aria-labelledby="product-title">
            <div className="section-heading centered" data-reveal>
              <p className="eyebrow"><span /> One connected system</p>
              <h2 id="product-title">From scattered deadlines to a day you can act on.</h2>
              <p>The same manual and synced tasks power your due-work list, Planner, Schedule, Can’t Miss Alarms, widgets, Focus Pulse, and blocker.</p>
            </div>
            <div className="bento-grid">
              <article className="bento-card bento-tasks" id="tasks" data-reveal>
                <p className="card-index">01 · DUE WORK</p><h3>One place for what’s due.</h3><p>Tasks you add manually and tasks synced from integrations appear in one list, with overdue work first and upcoming deadlines ordered by urgency.</p>
                <div className="bento-visual task-preview">{demoTasks.map((task) => <MiniTask task={task} key={task.title} />)}</div>
              </article>
              <article className="bento-card bento-planner" data-reveal>
                <p className="card-index">02 · PLANNER</p><h3>Choose a day for the work.</h3><p>Pick a day, add due tasks to that day’s plan, and see upcoming work that still needs scheduling.</p>
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
              <article className="bento-card bento-schedule" data-reveal>
                <p className="card-index">03 · SCHEDULE</p><h3>See the whole day in order.</h3><p>Schedule places work from Planner alongside due tasks, calendar events, classes, and shifts on one timed timeline.</p>
                <div className="schedule-preview">
                  <div className="day-row"><span>Tue<strong>5</strong></span><b>Wed<strong>6</strong></b><span>Thu<strong>7</strong></span><span>Fri<strong>8</strong></span></div>
                  <div className="schedule-line"><small>9 AM</small><i className="block-orange">Biology lab</i></div>
                  <div className="schedule-line"><small>11 AM</small><i className="block-violet">Project outline</i></div>
                  <div className="schedule-line"><small>2 PM</small><i className="block-cyan">Team brief</i></div>
                </div>
              </article>
              <article className="bento-card bento-protect" data-reveal>
                <p className="card-index">04 · APP PROTECTION</p><h3>Choose what gets interrupted.</h3><p>Choose which distracting apps Nonlate can interrupt. When one opens, Nonlate checks for unfinished due work and shows the blocker only when something needs attention.</p>
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
              <article className="bento-card bento-alarm" data-reveal>
                <p className="card-index">05 · CAN’T MISS ALARM</p><h3>Set an alarm you can’t miss.</h3><p>Attach an alarm to a task or scheduled item and choose the time. Nonlate then uses the strongest alarm presentation your device supports.</p>
                <div className="alarm-preview"><small>TASK · HISTORY ESSAY DRAFT</small><strong>9:00</strong><span>MONDAY · 8:00 AM</span><button type="button" tabIndex={-1}>Snooze</button></div>
              </article>
              <article className="bento-card bento-widget" data-reveal>
                <p className="card-index">06 · AT A GLANCE</p><h3>Keep the next deadline in sight.</h3><p>Widgets show your next task, today’s plan, or the coming week without opening Nonlate. Supported iPhones also use Live Activities and Dynamic Island for active countdowns.</p>
                <div className="widget-preview"><span><small>NONLATE · DUE SOON</small><b>Biology lab</b><strong>10:08</strong></span><span className="break-widget"><small>BREAK ACTIVE</small><b>Blocking resumes</b><strong>09:55</strong></span></div>
              </article>
            </div>
          </section>

          <section className="behavior-section section-shell" aria-labelledby="behavior-title">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span /> Deadline-aware blocking</p>
              <h2 id="behavior-title">The blocker is the product.</h2>
              <p>When a selected distraction opens, Nonlate checks unfinished tasks that are overdue or inside your chosen due window. Calendar events can appear in Schedule, but they never trigger the blocker.</p>
            </div>
            <div className="behavior-grid">
              <article className="behavior-card behavior-blocker" data-reveal>
                <p>{blockingBehavior.label}</p><h3>{blockingBehavior.title}</h3><p>{blockingBehavior.description}</p><span>{blockingBehavior.friction}</span>
              </article>
              <article className="focus-lock-card" data-reveal>
                <div><p>Optional setting</p><h3>Focus Lock</h3><p>Focus Lock removes the quick-break choice from the blocker. To take a break, return to Nonlate, pause for a short reflection, and then start the configured timer.</p></div>
                <span>Stronger break control</span>
              </article>
            </div>
          </section>

          <section className="integrations-section section-shell" id="integrations" aria-labelledby="integrations-title">
            <div className="section-heading centered" data-reveal>
              <p className="eyebrow"><span /> Integrations</p>
              <h2 id="integrations-title">Connect the tools already holding your responsibilities.</h2>
              <p>Connect the school, calendar, to-do, and work services you already use. Supported tasks and due dates join the same list as manual tasks, so you do not have to enter them twice.</p>
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
              <p className="eyebrow"><span /> Current builds</p>
              <h2 id="screens-title">Real screens. Platform-native details.</h2>
              <p>These are current iOS and Android screens. Planner assigns work to a date or session; Schedule places that work beside tasks, events, classes, and shifts in one timed view.</p>
            </div>
            <div className="screen-rail">
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
              <h2 id="personal-title">More human than a wall of statistics.</h2>
              <p>Choose what the blocker says and how Nonlate looks, then use Focus Pulse to understand how consistently you finish due work on time.</p>
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
              <h2 id="plans-title">Start simply. Add friction when you need it.</h2>
              <p>Start with one connected source and three protected apps. Paid plans add more sources, faster sync, broader blocking, customization, insights, and no ads; exact store pricing appears at launch.</p>
            </div>
            <div className="plans-grid">
              {planTiers.map((plan) => (
                <article className={`plan-card${plan.highlighted ? " is-highlighted" : ""}`} key={plan.name} data-reveal>
                  {plan.highlighted ? <span className="plan-badge">Best for most people</span> : null}
                  <p>{plan.eyebrow}</p><h3>{plan.name}</h3><strong>{plan.price}</strong>
                  <ul>{plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}</ul>
                  <div className="plan-status">Coming soon</div>
                </article>
              ))}
            </div>
            <p className="section-note">Features can vary by platform and provider. Paid pricing may vary by region.</p>
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
              <article data-reveal><span>02</span><div><h3>Limited use of Google data</h3><p>Google task and calendar data is used only to provide connected sync and Nonlate features—not advertising or generalized AI training.</p></div></article>
              <article data-reveal><span>03</span><div><h3>Your connections stay reversible</h3><p>Disconnect a source in Nonlate settings or request deletion through support at any time.</p></div></article>
            </div>
          </section>

          <section className="faq-section section-shell" id="faq" aria-labelledby="faq-title">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span /> Questions, answered plainly</p>
              <h2 id="faq-title">Before Nonlate steps in.</h2>
              <p>The important details without the productivity theater.</p>
            </div>
            <div className="faq-list">
              {faqEntries.map((entry) => <details key={entry.question} data-reveal><summary>{entry.question}<span>+</span></summary><p>{entry.answer}</p></details>)}
            </div>
          </section>

          <section className="closing-section section-shell" id="coming-soon" aria-labelledby="closing-title" data-reveal>
            <div className="closing-glow" aria-hidden="true" />
            <img src="/assets/nonlate-icon.png" alt="Nonlate app icon" width="104" height="104" />
            <p className="eyebrow"><span /> Be on time. Gently.</p>
            <h2 id="closing-title">Put the deadline before the distraction.</h2>
            <p>Nonlate is coming soon to iOS and Android. No signup form, no inbox promise, and no store button before it is real.</p>
            <div className="platform-statuses" aria-label="Planned platforms"><span><i></i><b>iOS</b><small>Coming soon</small></span><span><i>◆</i><b>Android</b><small>Coming soon</small></span></div>
            <a className="button-secondary" href="/support/">Questions? Visit support</a>
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
