import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with Nonlate integrations, sync, privacy choices, or data deletion.",
  alternates: { canonical: "/support/" },
};

export default function SupportPage() {
  return (
    <LegalPage eyebrow="Help" title="Support" description="Need help with Nonlate? Contact support and we will respond as soon as possible." updated="April 2, 2026" currentHref="/support/">
      <h2>Support email</h2>
      <div className="email-card"><strong>support@nonlate.app</strong><a className="button-primary" href="mailto:support@nonlate.app">Email support</a></div>

      <h2>Include these details</h2>
      <ul><li>Device model and OS version.</li><li>App version.</li><li>A short description of the issue.</li><li>Screenshots or logs, if available.</li></ul>

      <h2>Common requests</h2>
      <div className="support-grid">
        <section className="support-card"><h3>Integration connection problems</h3><p>Provider login, permissions, or callback issues.</p></section>
        <section className="support-card"><h3>Sync issues</h3><p>Tasks, due dates, or calendars not appearing as expected.</p></section>
        <section className="support-card"><h3>Ad privacy choices</h3><p>Questions about consent, ATT, or ad privacy settings.</p></section>
        <section className="support-card"><h3>Data deletion requests</h3><p>Requests to remove data associated with Nonlate.</p></section>
      </div>
    </LegalPage>
  );
}
