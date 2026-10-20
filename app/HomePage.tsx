"use client";
import { useWebsiteLocale } from "./components/WebsiteLocale";
/* eslint-disable @next/next/no-img-element -- local product art is pre-sized and the gallery is lazy-loaded */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import { MascotVignette } from "./components/MascotVignette";
import { appStoreUrl, playStoreUrl, demoPhases, faqEntries, previewIntegrations, integrationGroups, planTiers, type Platform, } from "./site-data";
const demoTasks = [
    { title: "Submit biology lab", due: "Overdue", source: "Canvas", icon: "/assets/integrations/canvas.png", urgent: true },
    { title: "Project outline", due: "Due in 2h", source: "Notion", icon: "/assets/integrations/notion.png" },
    { title: "Team brief", due: "Due today", source: "Slack", icon: "/assets/integrations/slack.png" },
];
const screenGallery = [
    { src: "/assets/screens/ios-home.png", alt: "Nonlate iOS Home showing overdue and upcoming tasks from connected sources", platform: "iOS", label: "Home · due tasks" },
    { src: "/assets/screens/ios-tasks.png", alt: "Nonlate iOS Tasks bringing imported tasks and personal reminders into one searchable list", platform: "iOS", label: "Tasks · one list" },
    { src: "/assets/screens/ios-planner.png", alt: "Nonlate iOS Planner assigning upcoming tasks to a chosen day", platform: "iOS", label: "Planner · choose a day" },
    { src: "/assets/screens/android-schedule.png", alt: "Nonlate Android Schedule arranging planned work, tasks, events, classes, and shifts by time", platform: "Android", label: "Schedule · timed day" },
    { src: "/assets/screens/android-blocker.png", alt: "Nonlate Android Blocker showing due tasks before a distracting app", platform: "Android", label: "Blocker · due-work check" },
    { src: "/assets/screens/android-insights.png", alt: "Nonlate Android Insights showing Focus Pulse, streaks, focus rhythm, and recovery", platform: "Android", label: "Insights · Focus Pulse" },
];
const storeArtworkKind = "store-illustration";
const isIllustration = (kind?: string) => kind === storeArtworkKind || kind === "website-illustration";
const deviceScreenshotKind = "device-screenshot";
function ScreenGallery() {
    const { t, locale, screenshot, illustrationLabel, playIllustrationLabel } = useWebsiteLocale();
    const mediaLabel = (platform: string) => platform === "Android" ? playIllustrationLabel : illustrationLabel;
    const railRef = useRef<HTMLDivElement>(null);
    const [range, setRange] = useState({ first: 1, last: 4, atStart: true, atEnd: false });
    useEffect(() => {
        const rail = railRef.current;
        if (!rail)
            return;
        const update = () => {
            const bounds = rail.getBoundingClientRect();
            const visible = Array.from(rail.children).flatMap((card, index) => {
                const box = card.getBoundingClientRect();
                const overlap = Math.min(box.right, bounds.right) - Math.max(box.left, bounds.left);
                return overlap >= box.width / 2 ? [index + 1] : [];
            });
            setRange({
                first: visible[0] ?? 1,
                last: visible.at(-1) ?? 1,
                atStart: rail.scrollLeft <= 2,
                atEnd: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2,
            });
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(rail);
        rail.addEventListener("scroll", update, { passive: true });
        return () => { observer.disconnect(); rail.removeEventListener("scroll", update); };
    }, []);
    const move = (direction: number) => {
        const rail = railRef.current;
        if (!rail)
            return;
        const first = rail.children[0] as HTMLElement;
        const second = rail.children[1] as HTMLElement;
        const step = second.offsetLeft - first.offsetLeft;
        const index = Math.round(rail.scrollLeft / step) + direction;
        rail.scrollTo({ left: index * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    };
    return (<>
      <div className="screen-controls">
        <p id="screen-help">{t("Swipe or use the arrows to explore all six screens.")}</p>
        <div className="screen-navigation">
          <span aria-live="polite" aria-atomic="true">{t(range.last !== range.first ? "Screens {first}–{last} of {total}" : "Screens {first} of {total}").replace("{first}", String(range.first)).replace("{last}", String(range.last)).replace("{total}", String(screenGallery.length))}</span>
          <button type="button" aria-label={t("Previous app screenshots")} aria-controls="app-screen-rail" disabled={range.atStart} onClick={() => move(-1)}>{t("\u2190")}</button>
          <button type="button" aria-label={t("Next app screenshots")} aria-controls="app-screen-rail" disabled={range.atEnd} onClick={() => move(1)}>{t("\u2192")}</button>
        </div>
      </div>
      <div ref={railRef} id="app-screen-rail" className="screen-rail" role="region" aria-label={t("Actual app screenshots")} aria-describedby="screen-help" tabIndex={0}>
        {t(screenGallery.map((screen) => (<figure key={screen.src}>
            <div className="screen-meta"><span>{t(screen.platform)}</span><strong>{t(screen.label)}</strong></div>
            <img data-artwork-kind={screenshot(screen.src).kind ?? deviceScreenshotKind} className={isIllustration(screenshot(screen.src).kind) ? storeArtworkKind : undefined} src={screenshot(screen.src).src} alt={screenshot(screen.src).kind === storeArtworkKind ? `${mediaLabel(screen.platform)} · ${t(screen.platform)} · ${t(screen.label)}` : t(screen.alt)} loading="lazy" width={screenshot(screen.src).width ?? 660} height={screenshot(screen.src).height ?? (screen.platform === "iOS" ? 1434 : 1173)}/>
            {screenshot(screen.src).kind === storeArtworkKind ? <figcaption className="screenshot-language-note">{mediaLabel(screen.platform)}</figcaption> : null}
            {locale !== "en" && screenshot(screen.src).language === "en" ? <figcaption className="screenshot-language-note">{t("English screenshot")}</figcaption> : null}
          </figure>)))}
      </div>
    </>);
}
function StoreBadges({ className }: {
    className: string;
}) {
    const { t } = useWebsiteLocale();
    return (<div className={`store-badges ${className}`} aria-label={t("Download Nonlate")}>
      <a className="store-badge" href={appStoreUrl} aria-label={t("Download Nonlate on the App Store")}>
        <img src="/assets/store-badges/app-store.svg" alt={t("Download on the App Store")} width="120" height="40"/>
      </a>
      <a className="store-badge" href={playStoreUrl} aria-label={t("Get Nonlate on Google Play")}>
        <img src="/assets/store-badges/google-play.svg" alt={t("Get it on Google Play")} width="239" height="71"/>
      </a>
    </div>);
}
function SourcePill({ icon, label, note }: {
    icon: string;
    label: string;
    note?: string;
}) {
    const { t } = useWebsiteLocale();
    return (<span className="source-pill">
      <img src={icon} alt={t("")} width="24" height="24"/>
      <span>{t(label)}</span>
      {t(note ? <small>{t(note)}</small> : null)}
    </span>);
}
function MiniTask({ task, compact = false }: {
    task: (typeof demoTasks)[number];
    compact?: boolean;
}) {
    const { t } = useWebsiteLocale();
    return (<div className={`mini-task${task.urgent ? " is-urgent" : ""}${compact ? " is-compact" : ""}`}>
      <img src={task.icon} alt={t("")} width="32" height="32"/>
      <span>
        <strong>{t(task.title)}</strong>
        <small>{t(task.source)}</small>
      </span>
      <em>{t(task.due)}</em>
    </div>);
}
function BlockerCapture({ platform }: {
    platform: Platform;
}) {
    const { t, locale, screenshot, illustrationLabel, playIllustrationLabel } = useWebsiteLocale();
    const isIOS = platform === "ios";
    const asset = screenshot(`/assets/screens/${platform}-blocker.png`);
    const illustrated = isIllustration(asset.kind);
    const imageLabel = asset.kind === "website-illustration" ? `Nonlate · ${t(isIOS ? "iOS" : "Android")}` : isIOS ? illustrationLabel : playIllustrationLabel;
    return (<figure className={`blocker-capture blocker-capture-${platform}${illustrated ? " blocker-store-illustration" : ""}`}>
      <div className="capture-label"><span>{t(isIOS ? "iOS" : "Android")}</span>{illustrated ? imageLabel : t(locale !== "en" && asset.language === "en" ? "English screenshot" : "Actual blocker screen")}</div>
      <div className="capture-frame">
        {illustrated ? <img className="capture-store-art" data-artwork-kind={asset.kind} src={asset.src} alt={`${imageLabel} · Nonlate · ${t(isIOS ? "iOS" : "Android")}`} width={asset.width} height={asset.height} fetchPriority="high"/> : <><div className="capture-copy">
          <h3>{t("Distracting apps get")}<br />{t("blocked when work is due")}</h3>
          <p>{t("See what\u2019s overdue and due next. Complete the work or take a timed break to regain access.")}</p>
        </div>
        <div className="capture-screen">
        <img src={screenshot(`/assets/screens/${platform}-blocker.png`).src} alt={t(isIOS ? "Actual Nonlate iOS blocker screen" : "Actual Nonlate Android blocker screen")} width={isIOS ? "736" : "787"} height={isIOS ? "1600" : "1400"} fetchPriority="high"/>
        </div>
        </>}
      </div>
      <figcaption>{t("{platform} blocker example").replace("{platform}", isIOS ? "iOS" : "Android")}{locale !== "en" && screenshot(`/assets/screens/${platform}-blocker.png`).language === "en" ? <> · {t("English screenshot")}</> : null}</figcaption>
    </figure>);
}
function DualPhoneDemo() {
    const { t } = useWebsiteLocale();
    return (<div className="dual-phone-stage">
      <div className="stage-halo" aria-hidden="true"/>
      <div className="floating-chip chip-sync"><img src="/assets/integrations/google_calendar.png" alt={t("")}/>{t(" your tools, ")}<b>{t("together")}</b></div>
      <div className="floating-chip chip-overdue"><img src="/assets/integrations/canvas.png" alt={t("")}/> <b>{t("1 overdue")}</b></div>
      <BlockerCapture platform="ios"/>
      <BlockerCapture platform="android"/>
    </div>);
}
function InterceptDialog({ onClose, onViewTasks, onBreak }: {
    onClose: () => void;
    onViewTasks: () => void;
    onBreak: () => void;
}) {
    const { t } = useWebsiteLocale();
    const dialogRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog)
            return;
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button, a[href], [tabindex]:not([tabindex='-1'])"));
        focusable[0]?.focus();
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== "Tab" || focusable.length === 0)
                return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);
    return (<div className="intercept-veil" role="presentation">
      <div className="intercept-dialog" role="dialog" aria-modal="true" aria-labelledby="intercept-title" aria-describedby="intercept-description" ref={dialogRef}>
        <button className="dialog-close" type="button" onClick={onClose} aria-label={t("Close interactive demo")}>{t("\u00D7")}</button>
        <p className="dialog-badge"><span />{t(" Interactive demo \u00B7 Nonlate stepped in")}</p>
        <p className="dialog-progress">{t("You opened a distraction while three tasks were due.")}</p>
        <h2 id="intercept-title">{t("Your next deadline beats the feed.")}</h2>
        <p id="intercept-description">{t("Website demo: these sample tasks are not real and nothing is changed. In the app, Nonlate would show your overdue and upcoming work here.")}</p>
        <div className="dialog-tasks">{t(demoTasks.map((task) => <MiniTask key={task.title} task={task}/>))}</div>
        <div className="dialog-actions">
          <button className="button-primary" type="button" onClick={onViewTasks}>{t("View tasks ")}<span>{t("\u2192")}</span></button>
          <button className="button-secondary" type="button" onClick={onBreak}>{t("Take a 10-minute break")}</button>
        </div>
        <p className="dialog-footnote">{t("\u201CView tasks\u201D closes this website demo without moving the page.")}</p>
      </div>
    </div>);
}
function formatClock(seconds: number) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const remainder = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainder}`;
}
function getSavedBreakSeconds() {
    if (typeof window === "undefined")
        return 0;
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
    const { t, locale, localHref } = useWebsiteLocale();
    const reducedMotion = useSyncExternalStore(subscribeMotionPreference, getMotionPreference, getServerMotionPreference);
    const [interceptOpen, setInterceptOpen] = useState(false);
    // The server cannot read sessionStorage. Restore a saved demo break only
    // after hydration so a reload keeps the timer without replacing the page.
    const [breakLeft, setBreakLeft] = useState(0);
    const [scrollProgress, setScrollProgress] = useState(0);
    const mainShellRef = useRef<HTMLDivElement>(null);
    const lastFocusedRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
        let queued = false;
        const onScroll = () => {
            if (queued)
                return;
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
        const restoreFrame = window.requestAnimationFrame(() => setBreakLeft(getSavedBreakSeconds()));
        const timer = window.setInterval(() => {
            const expiry = Number(window.sessionStorage.getItem("nonlate-demo-break-until") || 0);
            if (expiry <= 0)
                return;
            const next = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
            setBreakLeft(next);
            if (next === 0)
                window.sessionStorage.removeItem("nonlate-demo-break-until");
        }, 1000);
        return () => {
            window.cancelAnimationFrame(restoreFrame);
            window.clearInterval(timer);
        };
    }, []);
    useEffect(() => {
        const root = mainShellRef.current;
        if (!root)
            return;
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
        const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { rootMargin: "0px 0px -12%", threshold: 0.08 });
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
                inLanguage: locale,
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
                offers: { "@type": "Offer", name: "Free download with optional Plus and Pro subscriptions", price: "0", priceCurrency: "USD", url: `https://nonlate.app/${locale === "en" ? "" : `${locale}/`}#plans` },
            },
            {
                "@type": "FAQPage",
                inLanguage: locale,
                "@id": `https://nonlate.app/${locale === "en" ? "" : `${locale}/`}#faq`,
                mainEntity: faqEntries.map((entry) => ({
                    "@type": "Question",
                    name: entry.question,
                    acceptedAnswer: { "@type": "Answer", text: entry.answer },
                })),
            },
        ],
    };
    return (<>
      <div className="scroll-meter" aria-hidden="true"><span style={{ width: `${scrollProgress}%` }}/></div>
      <div id="site-shell" ref={mainShellRef}>
        <a className="skip-link" href="#main-content">{t("Skip to content")}</a>
        <SiteHeader />
        <main id="main-content">
          <section className="hero section-shell" aria-labelledby="hero-title">
            <div className="hero-copy" data-reveal>
              <h1 id="hero-title">{t("More connected.")}<strong>{t("Less distracted.")}</strong></h1>
              <p className="hero-support">{t("Stay ahead of what\u2019s due.")}</p>
              <p className="hero-lede">{t("Your tasks, deadlines, and plans\u2014together. Nonlate connects the tools you already use and steps in when a chosen distraction gets ahead of unfinished work.")}</p>
              <StoreBadges className="hero-actions"/>
              <p className="hero-free-note">{t("Start free. No Nonlate account required. ")}<a href="#plans">{t("See plans \u2192")}</a></p>
              <dl className="hero-stats" aria-label={t("Product highlights")}>
                <div><dt>{t("Connect")}</dt><dd>{t("School, work, tasks & calendars")}</dd></div>
                <div><dt>{t("Plan")}</dt><dd>{t("One clear view of your day")}</dd></div>
                <div><dt>{t("Focus")}</dt><dd>{t("Deadlines before distractions")}</dd></div>
              </dl>
            </div>

            <div className="hero-demo" data-reveal>
              <DualPhoneDemo />
            </div>
          </section>

          <section className="integration-preview section-shell" aria-labelledby="integration-preview-title">
            <div className="integration-preview-heading">
              <h2 id="integration-preview-title">{t("Works with your tools")}</h2>
            </div>
            <div className="integration-preview-window" tabIndex={0} role="region" aria-label={t("All integrations. Automatically scrolling; use arrow keys to explore.")}>
              <div className="integration-preview-track">
                <ul className="integration-preview-list" aria-label={t("Supported integration services")}>
                  {t(previewIntegrations.map((item) => (<li key={item.name}><SourcePill icon={item.icon} label={t(item.name)} note={t(item.platformNote)}/></li>)))}
                </ul>
                <ul className="integration-preview-list integration-preview-copy" aria-hidden="true">
                  {t(previewIntegrations.map((item) => (<li key={item.name}><SourcePill icon={item.icon} label={t(item.name)} note={t(item.platformNote)}/></li>)))}
                </ul>
              </div>
            </div>
          </section>

          <div className="launch-strip section-shell">
            <p>{t("Made for your real day.")}<span>{t(" School. Work. Everything in between.")}</span></p>
          </div>

          <section className="moment section-shell" id="moment" aria-labelledby="moment-title">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span />{t(" A little help at the right moment")}</p>
              <h2 id="moment-title">{t("Before the feed.")}<br />{t("What needs you?")}</h2>
              <p>{t("Choose the distractions Nonlate can interrupt. When work is due, your next task gets the first word.")}</p>
              <button type="button" className="button-primary demo-launch" onClick={openIntercept}>{t("Try the blocker demo ")}<span aria-hidden="true">{t("\u2197")}</span></button>
              <small className="demo-disclaimer">{t("Just a website preview. Nothing on your device is blocked.")}</small>
            </div>
            <div className="moment-visual" data-reveal>
              <span className="film-orbit" aria-hidden="true"/>
              <MascotVignette id="distraction-film" src="/assets/films/outrun-distraction.mp4" poster="/assets/films/outrun-distraction.jpg" title={t("Meet the little nudge.")} description={t("A tiny teammate steps between a wandering phone and the next scroll.")} reducedMotion={reducedMotion}/>
              <p className="film-side-note"><span aria-hidden="true">{t("\u2726")}</span>{t(" A little character.")}<br /><strong>{t("A clearer boundary.")}</strong></p>
            </div>
            <ol className="moment-steps">
              {t(demoPhases.map((item, index) => (<li key={item.id} data-reveal>
                  <span>{t("0")}{t(index + 1)}</span>
                  <div><h3>{t(item.title)}</h3><p>{t(item.description)}</p></div>
                </li>)))}
            </ol>
            <p className="moment-note">{t("Only unfinished due tasks trigger blocking\u2014not calendar events. Want a firmer boundary? Optional Focus Lock moves quick breaks back into Nonlate.")}</p>
          </section>

          <section className="product-section section-shell" id="product" aria-labelledby="product-title">
            <div className="section-heading centered" data-reveal>
              <p className="eyebrow"><span />{t(" One connected system")}</p>
              <h2 id="product-title">{t("Less juggling.")}<br />{t("More doing.")}</h2>
              <p>{t("Keep what\u2019s due, what\u2019s planned, and what needs your focus working together.")}</p>
            </div>
            <div className="bento-grid">
              <article className="bento-card bento-tasks" id="tasks" data-reveal>
                <p className="card-index">{t("01 \u00B7 CONNECT")}</p><h3>{t("One place for what\u2019s due.")}</h3><p>{t("Add your own tasks or connect your existing tools. See overdue work first and upcoming deadlines next.")}</p>
                <div className="bento-visual task-preview">{t(demoTasks.map((task) => <MiniTask task={task} key={task.title}/>))}</div>
              </article>
              <article className="bento-card bento-planner" data-reveal>
                <p className="card-index">{t("02 \u00B7 PLAN")}</p><h3>{t("Make room for the work.")}</h3><p>{t("Choose a day in Planner. Then see planned work, deadlines, events, classes, and shifts together in Schedule.")}</p>
                <div className="planner-preview" aria-label={t("Planner preview with chosen days, today’s plan, and an upcoming task")}>
                  <div className="planner-preview-head"><strong>{t("Choose a day")}</strong><small>{t("Swipe for later dates")}</small></div>
                  <div className="planner-days"><b>{t("Sun")}<strong>{t("5")}</strong></b><span>{t("Mon")}<strong>{t("6")}</strong></span><span>{t("Tue")}<strong>{t("7")}</strong></span><span>{t("Wed")}<strong>{t("8")}</strong></span></div>
                  <div className="planner-list-head"><strong>{t("Today\u2019s plan ")}<span>{t("2")}</span></strong><small>{t("Drag tasks here")}</small></div>
                  <div className="planned-task"><i /><span><strong>{t("Project outline")}</strong><small>{t("in 1 hour")}</small></span><b>{t("\u21A9")}</b></div>
                  <div className="planned-task"><i /><span><strong>{t("Team brief")}</strong><small>{t("in 3 hours")}</small></span><b>{t("\u21A9")}</b></div>
                  <div className="planner-list-head planner-upcoming-head"><strong>{t("Upcoming tasks")}</strong><small>{t("Keep the day above")}</small></div>
                  <div className="planned-task planner-upcoming-task"><i /><span><strong>{t("Read chapter 8")}</strong><small>{t("in 18 hours")}</small></span><b>{t("Drag")}</b></div>
                </div>
              </article>
              <article className="bento-card bento-protect" data-reveal>
                <p className="card-index">{t("03 \u00B7 FOCUS")}</p><h3>{t("A nudge before the scroll.")}</h3><p>{t("Your chosen distractions can wait. See the work that needs attention, then choose the task or supported break action.")}</p>
                <div className="app-orbits" aria-label={t("Examples of social and entertainment apps you can protect")}>
                  <span className="orbit-center"><img src="/assets/nonlate-icon.png" alt={t("Nonlate")}/><small>{t("Nonlate")}</small></span>
                  <span className="app-dot app-youtube"><img src="/assets/distractions/youtube.svg" alt={t("YouTube")}/></span>
                  <span className="app-dot app-tiktok"><img src="/assets/distractions/tiktok.svg" alt={t("TikTok")}/></span>
                  <span className="app-dot app-instagram"><img src="/assets/distractions/instagram.svg" alt={t("Instagram")}/></span>
                  <span className="app-dot app-snapchat"><img src="/assets/distractions/snapchat.svg" alt={t("Snapchat")}/></span>
                  <span className="app-dot app-reddit"><img src="/assets/distractions/reddit.svg" alt={t("Reddit")}/></span>
                  <span className="app-dot app-x"><img src="/assets/distractions/x.svg" alt={t("X")}/></span>
                  <span className="app-dot app-facebook"><img src="/assets/distractions/facebook.svg" alt={t("Facebook")}/></span>
                </div>
              </article>
            </div>
            <div className="included-row">
              <article><span aria-hidden="true">{t("\u2197")}</span><div><h3>{t("A reminder with more presence.")}</h3><p>{t("Can\u2019t Miss Alarms use the strongest alarm presentation supported by your device.")}</p></div></article>
              <article><span aria-hidden="true">{t("\u25F7")}</span><div><h3>{t("Your next deadline, in sight.")}</h3><p>{t("Widgets and supported iPhone Live Activities keep the next step close.")}</p></div></article>
            </div>
          </section>

          <section className="integrations-section section-shell" id="integrations" aria-labelledby="integrations-title">
            <div className="integration-intro">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span />{t(" Integrations")}</p>
              <h2 id="integrations-title">{t("Your tools.")}<br />{t("Finally on the same page.")}</h2>
              <p>{t("Keep using the services you love. Bring supported tasks and due dates into Nonlate without entering them twice.")}</p>
            </div>
            <div className="wildlife-film" data-reveal>
              <MascotVignette id="deadline-film" src="/assets/films/deadline-in-the-wild.mp4" poster="/assets/films/deadline-in-the-wild.jpg" title={t("Catch it before “later.”")} description={t("Our little deadline hunter catches a task before it disappears into Later. Your work stays yours to complete.")} reducedMotion={reducedMotion}/>
            </div>
            </div>
            <div className="integration-grid">
              {t(integrationGroups.map((group) => (<article className={`integration-group accent-${group.accent}`} key={group.title} data-reveal>
                  <h3><span />{t(group.title)}</h3>
                  <div>{t(group.items.map((item) => <SourcePill key={item.name} icon={item.icon} label={t(item.name)} note={t(item.platformNote)}/>))}</div>
                </article>)))}
            </div>
            <p className="section-note">{t("Source availability, permissions, and sync speed vary by provider, platform, and plan. Imported calendar events appear in Schedule, but they are not due tasks and never trigger blocking.")}</p>
          </section>

          <section className="real-screens section-shell" aria-labelledby="screens-title">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span />{t(" Made for your phone")}</p>
              <h2 id="screens-title">{t("A clearer day.")}<br />{t("A real app.")}</h2>
              <p>{t("Actual iOS and Android screens, with platform-native details. Swipe through a few everyday views.")}</p>
            </div>
            <ScreenGallery />
          </section>

          <section className="personal-section section-shell" aria-labelledby="personal-title">
            <div className="section-heading centered" data-reveal>
              <p className="eyebrow"><span />{t(" Personal by design")}</p>
              <h2 id="personal-title">{t("A little more you.")}</h2>
              <p>{t("Make the experience yours, from your colors to the words that bring you back.")}</p>
            </div>
            <div className="personal-grid">
              <article data-reveal><span className="personal-number">{t("01")}</span><h3>{t("Choose the message that stops you.")}</h3><p>{t("On supported blocker screens, use the standard deadline prompt, write a custom message, or rotate Daily Wisdom in the tone you need.")}</p><div className="message-preview"><small>{t("TODAY\u2019S MESSAGE")}</small><blockquote>{t("\u201CStart smaller than your excuses.\u201D")}</blockquote><span>{t("Daily wisdom \u00B7 Calm")}</span></div></article>
              <article data-reveal><span className="personal-number">{t("02")}</span><h3>{t("See your Focus Pulse.")}</h3><p>{t("See on-time and missed due-work days, current and best streaks, your strongest weekdays, and how quickly you get back on track after a miss.")}</p><div className="pulse-preview"><div><span className="pulse-score"><strong>{t("82")}</strong><small>{t("FOCUS PULSE")}</small></span></div><span><b>{t("5")}</b>{t(" current")}</span><span><b>{t("12")}</b>{t(" best")}</span><span><b>{t("1.4d")}</b>{t(" recover")}</span></div></article>
              <article data-reveal><span className="personal-number">{t("03")}</span><h3>{t("Make focus feel yours.")}</h3><p>{t("Choose one of 12 built-in themes or create custom colors. Your selected theme carries through the app and supported widgets.")}</p><div className="theme-preview"><span className="theme-aurora">{t("Aurora")}</span><span className="theme-bloom">{t("Bloom")}</span><span className="theme-sage">{t("Sage")}</span><span className="theme-boring">{t("Boring")}</span><div className="theme-more"><div className="theme-more-swatches" aria-hidden="true"><i className="swatch-nightfall"/><i className="swatch-sky"/><i className="swatch-golden"/><i className="swatch-berry"/></div><p><strong>{t("+8 more themes")}</strong><small>{t("Custom colors too")}</small></p></div></div></article>
            </div>
          </section>

          <section className="plans-section section-shell" id="plans" aria-labelledby="plans-title">
            <div className="section-heading centered" data-reveal>
              <p className="eyebrow"><span />{t(" A plan for every level of focus")}</p>
              <h2 id="plans-title">{t("Start free.")}<br />{t("Connect more when you\u2019re ready.")}</h2>
              <p>{t("Manual tasks and core blocking stay free. Plus adds more connections and personalization. Pro brings everything together.")}</p>
            </div>
            <div className="plans-grid">
              {t(planTiers.map((plan) => (<article className={`plan-card${plan.highlighted ? " is-highlighted" : ""}`} key={plan.name} data-reveal>
                  {t(plan.highlighted ? <span className="plan-badge">{t("Best for most people")}</span> : null)}
                  <p>{t(plan.eyebrow)}</p><h3>{t(plan.name)}</h3><strong>{t(plan.price)}</strong>
                  {t(plan.annualPrice ? <span className="plan-annual-price">{t("or ")}{t(plan.annualPrice)}{t(", billed annually")}</span> : null)}
                  <ul>{t(plan.features.map((feature) => <li key={feature}><span>{t("\u2713")}</span>{t(feature)}</li>))}</ul>
                  <a className="plan-status" href="#coming-soon">{t("Choose your plan in the app ")}<span aria-hidden="true">{t("\u2197")}</span></a>
                </article>)))}
            </div>
            <p className="section-note">{t("Eligible subscribers can try Plus free for 7 days on Monthly or Yearly. After the trial, the selected paid plan renews automatically unless cancelled. Eligibility, the full localized renewal price, and the billing period are confirmed in your app store before subscribing.")}</p>
            <p className="section-note">{t("Prices shown are USD reference prices; prices and availability may vary by region and platform. Manage or cancel subscriptions in the purchasing store. Features and sync timing vary by provider and device.")}</p>
            <p className="section-note">{t("One source for 30 days. No payment or automatic charge. Change sources without restarting your trial.")} {t("When the source trial ends, syncing pauses; imported tasks remain available for local completion and blocking.")}</p>
          </section>

          <section className="privacy-section section-shell" id="privacy" aria-labelledby="privacy-title">
            <div className="privacy-copy" data-reveal>
              <p className="eyebrow"><span />{t(" Privacy by design")}</p>
              <h2 id="privacy-title">{t("Connected data is for your deadlines.")}</h2>
              <p>{t("Nonlate processes task and calendar details only for services you choose to connect, stores credentials using platform-secure storage, and lets you disconnect sources or request deletion.")}</p>
              <a className="text-action" href={localHref("/privacy/")}>{t("Read the full privacy policy ")}<span>{t("\u2192")}</span></a>
            </div>
            <div className="privacy-points">
              <article data-reveal><span>{t("01")}</span><div><h3>{t("Protected in transit and at rest")}</h3><p>{t("HTTPS/TLS in transit, Keychain on iOS, and Keystore-backed encrypted preferences on Android.")}</p></div></article>
              <article data-reveal><span>{t("02")}</span><div><h3>{t("Limited use of Google data")}</h3><p>{t("Google task and calendar data is used only to provide connected sync and Nonlate features, not advertising or generalized AI training.")}</p></div></article>
              <article data-reveal><span>{t("03")}</span><div><h3>{t("Your connections stay reversible")}</h3><p>{t("Disconnect a source in Nonlate settings or request deletion through support at any time.")}</p></div></article>
            </div>
          </section>

          <section className="faq-section section-shell" id="faq" aria-labelledby="faq-title">
            <div className="section-heading" data-reveal>
              <p className="eyebrow"><span />{t(" Questions, answered plainly")}</p>
              <h2 id="faq-title">{t("Before Nonlate steps in.")}</h2>
              <p>{t("Clear answers, so you know what to expect.")}</p>
            </div>
            <div className="faq-list">
              {t(faqEntries.map((entry) => <details key={entry.question} data-reveal><summary>{t(entry.question)}<span>{t("+")}</span></summary><p>{t(entry.answer)}</p></details>))}
            </div>
          </section>

          <section className="closing-section section-shell" id="coming-soon" aria-labelledby="closing-title" data-reveal>
            <div className="closing-glow" aria-hidden="true"/>
            <img className="closing-mascot" src="/assets/mascots/victory.png" alt={t("")} width="192" height="192" loading="lazy"/>
            <p className="eyebrow"><span />{t(" From all over the place. To one place.")}</p>
            <h2 id="closing-title">{t("Your day.")}<br />{t("Back in your hands.")}</h2>
            <p>{t("Stay ahead of what\u2019s due. Start free on iOS or Android, with no Nonlate account required.")}</p>
            <StoreBadges className="closing-store-badges"/>
            <a className="text-action" href={localHref("/support/")}>{t("Questions? We\u2019re here to help ")}<span>{t("\u2192")}</span></a>
          </section>
        </main>
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, (key, value) => typeof value === "string" ? t(value) : value).replace(/</g, "\\u003c") }}/>
      </div>

      {t(interceptOpen ? <InterceptDialog onClose={closeIntercept} onViewTasks={viewTasks} onBreak={startBreak}/> : null)}
      {t(breakLeft > 0 ? (<div className="break-pill" role="status">
          <span className="break-dot" aria-hidden="true"/>
          <span><small>{t("DEMO BREAK ACTIVE")}</small><strong>{t(formatClock(breakLeft))}</strong></span>
          <button type="button" onClick={endBreak}>{t("End break")}</button>
        </div>) : null)}
    </>);
}
