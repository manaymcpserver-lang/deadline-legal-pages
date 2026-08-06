"use client";

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
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="Nonlate home" onClick={() => setOpen(false)}>
          <img src="/assets/nonlate-icon.png" alt="" width="38" height="38" />
          <span>Nonlate</span>
        </Link>

        <nav className={`primary-nav${open ? " is-open" : ""}`} aria-label="Primary">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <Link className="status-chip" href="/#coming-soon">
            <span aria-hidden="true" /> Coming soon
          </Link>
          <button
            className="menu-button"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <i />
            <i />
          </button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid section-shell">
        <div className="footer-brand">
          <Link className="brand" href="/">
            <img src="/assets/nonlate-icon.png" alt="" width="38" height="38" />
            <span>Nonlate</span>
          </Link>
          <p>Real deadlines, at the moment they matter. Built for school, work, and everything in between.</p>
          <span className="mono-label">Be on time. Gently.</span>
        </div>
        <div>
          <h2>Product</h2>
          <Link href="/#moment">How it works</Link>
          <Link href="/#product">Features</Link>
          <Link href="/#integrations">Integrations</Link>
          <Link href="/#plans">Plans</Link>
        </div>
        <div>
          <h2>Help</h2>
          <Link href="/support/">Support</Link>
          <Link href="/#faq">FAQ</Link>
          <a href="mailto:support@nonlate.app">Contact</a>
        </div>
        <div>
          <h2>Legal</h2>
          <Link href="/privacy/">Privacy</Link>
          <Link href="/terms/">Terms</Link>
          <Link href="/data-deletion/">Data deletion</Link>
        </div>
      </div>
      <div className="footer-bottom section-shell">
        <span>© 2026 Nonlate. All rights reserved.</span>
        <span className="mono-label">nonlate.app</span>
      </div>
    </footer>
  );
}
