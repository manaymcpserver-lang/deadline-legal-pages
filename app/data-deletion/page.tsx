import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Data Deletion",
  description: "How to remove local and connected data associated with Nonlate.",
  alternates: { canonical: "/data-deletion/" },
};

export default function DataDeletionPage() {
  return (
    <LegalPage eyebrow="Privacy control" title="Data Deletion" description="You can remove your data from Nonlate using the options below." updated="October 7, 2026" currentHref="/data-deletion/">
      <h2>Option 1: Remove local app data</h2>
      <ul><li>Disconnect integrations from the app settings.</li><li>Clear app data or uninstall the app to remove ordinary local app data.</li><li>Protected recovery credentials, platform redemption signals, and server records may survive uninstalling. Uninstalling does not cancel a store subscription.</li></ul>

      <h2>Option 2: Email deletion request</h2>
      <p>Send a request to <a href="mailto:support@nonlate.app">support@nonlate.app</a> with subject <code>Nonlate Data Deletion Request</code>.</p>
      <p>Include your platform and any anonymous trial or integration identifier available in the app needed to locate your records. Nonlate does not require a login. Do not send passwords, provider access tokens, or payment-card details.</p>
      <p>Ask us to remove applicable server-side integration records, authorized sync metadata, and source-trial records. We may ask for information needed to verify the request and identify your data. We will explain any limited security or legally required retention. Trial records are not automatically deleted after 90 days.</p>

      <h2>Connected services</h2>
      <p>For data held by third-party services you connected, such as Notion, Google, Microsoft, or Jira, you may also need to remove data directly with those providers according to their policies.</p>
    </LegalPage>
  );
}
