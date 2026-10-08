import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when using Nonlate.",
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" description="By using Nonlate, you agree to these terms." updated="October 7, 2026" currentHref="/terms/">
      <h2>Service</h2>
      <p>Nonlate helps users organize deadlines and tasks, including by connecting third-party services selected by the user.</p>

      <h2>Free features and source trial</h2>
      <p>Nonlate is ad-free. Manual tasks and on-device calendars and reminders remain free. The optional source trial permits one external source at a time for 30 days, starting with the first successful connection. Switching sources, reinstalling, or cancelling a subscription does not restart or extend the original window. The source trial has no automatic charge. At expiry, external syncing pauses while imported tasks remain available for local completion and blocking.</p>

      <h2>Subscriptions</h2>
      <p>Plus and Pro provide paid features within their respective source and syncing limits. The purchase screen displays the store-localized price, billing period, and available terms. Annual prices are billed as annual totals. Subscriptions renew automatically unless cancelled through the purchasing store under its rules. Deleting Nonlate does not cancel a subscription. Use Restore Purchases to recover eligible access. The source trial is separate from any store subscription introductory offer. Refund requests are handled under the purchasing store’s policies and applicable law.</p>

      <h2>User responsibilities</h2>
      <ul>
        <li>Use the app in compliance with applicable law.</li>
        <li>Do not abuse, disrupt, or attempt to reverse engineer service functionality.</li>
        <li>You are responsible for your connected third-party accounts and permissions.</li>
      </ul>

      <h2>Third-party services</h2>
      <p>Nonlate integrates with third-party providers. Their availability and behavior are outside Nonlate’s control and subject to their own terms and policies.</p>

      <h2>Disclaimer</h2>
      <p>The app is provided on an “as is” and “as available” basis without warranties of uninterrupted service.</p>

      <h2>Limitation of liability</h2>
      <p>To the maximum extent permitted by law, Nonlate is not liable for indirect, incidental, or consequential damages arising from app use.</p>

      <h2>Contact</h2>
      <p>Questions about these terms: <a href="mailto:support@nonlate.app">support@nonlate.app</a>.</p>
    </LegalPage>
  );
}
