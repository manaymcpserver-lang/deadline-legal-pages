import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import "./guides.css";

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />
      <main className="guides-main section-shell" id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}
