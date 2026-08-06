import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "./SiteChrome";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updated?: string;
  currentHref?: string;
  children: ReactNode;
};

const legalLinks = [
  ["/privacy/", "Privacy Policy"],
  ["/terms/", "Terms of Service"],
  ["/support/", "Support"],
  ["/data-deletion/", "Data Deletion"],
] as const;

export function LegalPage({ eyebrow, title, description, updated, currentHref, children }: LegalPageProps) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main className="legal-main" id="main-content">
        <div className="legal-ambient" aria-hidden="true" />
        <header className="legal-hero section-shell">
          <p className="eyebrow"><span />{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-intro">{description}</p>
          {updated ? <p className="legal-date">Last updated: {updated}</p> : null}
        </header>
        <article className="legal-content section-shell">{children}</article>
        <nav className="legal-links section-shell" aria-label="Nonlate pages">
          {legalLinks.map(([href, label]) => (
            <a href={href} aria-current={currentHref === href ? "page" : undefined} key={href}>{label}</a>
          ))}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
