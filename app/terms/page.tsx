import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that apply when using Nonlate.",
  alternates: { canonical: "/terms/" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" description="By using Nonlate, you agree to these terms." updated="April 2, 2026" currentHref="/terms/">
      <h2>Service</h2>
      <p>Nonlate helps users organize deadlines and tasks, including by connecting third-party services selected by the user.</p>

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
