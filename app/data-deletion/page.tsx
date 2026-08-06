import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Data Deletion",
  description: "How to remove local and connected data associated with Nonlate.",
  alternates: { canonical: "/data-deletion/" },
};

export default function DataDeletionPage() {
  return (
    <LegalPage eyebrow="Privacy control" title="Data Deletion" description="You can remove your data from Nonlate using the options below." updated="April 2, 2026" currentHref="/data-deletion/">
      <h2>Option 1: Remove local app data</h2>
      <ul><li>Disconnect integrations from the app settings.</li><li>Delete or uninstall the app from your device.</li><li>This removes local app data stored on your device.</li></ul>

      <h2>Option 2: Email deletion request</h2>
      <p>Send a request to <a href="mailto:support@nonlate.app">support@nonlate.app</a> with subject <code>Nonlate Data Deletion Request</code>.</p>
      <p>Include any account or integration identifiers needed to locate your records.</p>

      <h2>Connected services</h2>
      <p>For data held by third-party services you connected, such as Notion, Google, Microsoft, or Jira, you may also need to remove data directly with those providers according to their policies.</p>
    </LegalPage>
  );
}
