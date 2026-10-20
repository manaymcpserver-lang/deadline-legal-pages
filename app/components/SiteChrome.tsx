"use client";
import { useWebsiteLocale } from "./WebsiteLocale";
import { WebsiteLanguageMenu } from "./WebsiteLocale";
/* eslint-disable @next/next/no-img-element -- the local app icon is already optimized */
import Link from "next/link";
import { useEffect, useState } from "react";
const navigation = [
    { href: "/#moment", label: "How it works" },
    { href: "/#product", label: "Features" },
    { href: "/#integrations", label: "Integrations" },
    { href: "/#plans", label: "Plans" },
    { href: "/#privacy", label: "Privacy" },
];
export function SiteHeader() {
    const { t, localHref } = useWebsiteLocale();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (<header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="nav-shell">
        <Link className="brand" href={localHref("/")} aria-label={t("Nonlate home")} onClick={() => setOpen(false)}>
          <img src="/assets/nonlate-icon.png" alt={t("")} width="38" height="38"/>
          <span>{t("Nonlate")}</span>
        </Link>

        <nav className={`primary-nav${open ? " is-open" : ""}`} aria-label={t("Primary")}>
          {t(navigation.map((item) => (<Link href={localHref(item.href)} key={item.href} onClick={() => setOpen(false)}>
              {t(item.label)}
            </Link>)))}
        </nav>

        <div className="nav-actions">
          <button className="menu-button" type="button" aria-label={t("Toggle navigation")} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            <i />
            <i />
          </button>
        </div>
      </div>
    </header>);
}
export function SiteFooter() {
    const { t, localHref } = useWebsiteLocale();
    return (<footer className="site-footer">
      <div className="footer-grid section-shell">
        <div className="footer-brand">
          <Link className="brand" href={localHref("/")}>
            <img src="/assets/nonlate-icon.png" alt={t("")} width="38" height="38"/>
            <span>{t("Nonlate")}</span>
          </Link>
          <p>{t("Real deadlines, at the moment they matter. Built for school, work, and everyday life.")}</p>
          <span className="mono-label">{t("Be on time. Gently.")}</span>
        </div>
        <div>
          <h2>{t("Product")}</h2>
          <Link href={localHref("/#moment")}>{t("How it works")}</Link>
          <Link href={localHref("/#product")}>{t("Features")}</Link>
          <Link href={localHref("/#integrations")}>{t("Integrations")}</Link>
          <Link href={localHref("/#plans")}>{t("Plans")}</Link>
        </div>
        <div>
          <h2>{t("Help")}</h2>
          <a href={localHref("/support/")}>{t("Support")}</a>
          <a href={localHref("/guides/")}>{t("Guides")}</a>
          <Link href={localHref("/#faq")}>{t("FAQ")}</Link>
          <a href="/llms.txt">{t("Product facts")}</a>
          <a href="mailto:support@nonlate.app">{t("Contact")}</a>
        </div>
        <div>
          <h2>{t("Legal")}</h2>
          <a href={localHref("/privacy/")}>{t("Privacy")}</a>
          <a href={localHref("/terms/")}>{t("Terms")}</a>
          <a href={localHref("/data-deletion/")}>{t("Data deletion")}</a>
        </div>
      </div>
      <div className="footer-bottom section-shell">
        <WebsiteLanguageMenu />
        <span>{t("\u00A9 2026 Nonlate. All rights reserved.")}</span>
        <span className="mono-label">{t("nonlate.app")}</span>
      </div>
      <p className="trademark-note section-shell">{t("Apple, the Apple logo, and App Store are trademarks of Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC.")}</p>
    </footer>);
}
