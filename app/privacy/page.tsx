import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information Nonlate processes, how it is used, and the controls available to you.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" description="This policy explains what information Nonlate processes and how it is used." updated="October 7, 2026" currentHref="/privacy/">
      <p>Nonlate is built around the smallest practical amount of data needed to sync deadlines and show focus reminders.</p>

      <h2>What we process</h2>
      <ul>
        <li>Connection data for integrations you choose to connect.</li>
        <li>Task and calendar metadata needed for app features, such as title, due date, source, and completion status.</li>
        <li>App settings and focus preferences.</li>
        <li>Anonymous source-trial identifiers, hashed recovery credentials, original start and expiry dates, platform, and integrity status. The trial ledger does not contain provider credentials or hardware fingerprints.</li>
        <li>Subscription purchase and entitlement information, processed with the app store and RevenueCat to validate access and restore purchases.</li>
        <li>Diagnostic data for reliability, such as crash reports.</li>
      </ul>

      <h2>Google user data</h2>
      <p>If you choose to connect a Google integration, Nonlate requests only the read-only Google scopes needed to import your deadlines and keep them updated. Depending on the Google service you connect, Nonlate may access the following Google user data:</p>
      <ul>
        <li>Google Classroom: active course identifiers, course names, sections, rooms, coursework titles, coursework descriptions, due dates, due times, links, work types, maximum point values, your submission status for coursework, and your Google Classroom email address or profile identifier for account matching.</li>
        <li>Google Calendar: calendar list metadata, such as calendar identifiers, names, selection status, primary status, and access role, plus events from synced calendars in the sync window, including event identifiers, summaries, descriptions, locations, statuses, links, start and end dates or times, time zones, organizer names or email addresses, and the calendar/account identifier used to route sync updates.</li>
        <li>Google Tasks: task list identifiers, task list names, task identifiers, task titles, notes, due dates, and completion status for incomplete tasks.</li>
        <li>Google OAuth data: access tokens, refresh tokens, token expiration times, provider account identifiers, and webhook or channel identifiers needed to sync connected Google services and deliver update notifications.</li>
      </ul>
      <p>Nonlate uses Google user data only to sync connected Google Classroom, Google Calendar, and Google Tasks items into Nonlate, show reminders and focus features for those items, maintain the connection you requested, and support disconnect or deletion requests. Nonlate does not create, edit, or delete your Google Classroom, Calendar, or Tasks content. Nonlate does not sell Google user data, use it for advertising, or use it to develop, improve, or train generalized AI or machine learning models.</p>
      <p>Nonlate’s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>

      <h2>How we use this data</h2>
      <ul>
        <li>Sync tasks and events from connected services.</li>
        <li>Show reminders and focus features.</li>
        <li>Validate subscription access and protect the 30-day source trial against repeated redemption.</li>
        <li>Keep the app reliable and secure.</li>
      </ul>

      <h2>No advertising</h2>
      <p>The ad-free release (iOS 1.0.3 and Android 1.0.11) does not include Google AdMob, advertising-consent prompts, or advertising tracking requests. Older versions may include advertising features; updating to the ad-free release removes those features.</p>

      <h2>Source trial and device integrity</h2>
      <p>The optional source trial starts after your first successful external-source connection and lasts 30 days. Switching sources does not restart it, and it does not automatically charge you. Signed trial certificates are verified on your device. The trial service is contacted for activation, recovery, or suspicious certificate or time state, not for hourly trial checks.</p>
      <p>Apple App Attest and DeviceCheck and Google Play Integrity provide app or device-integrity signals. Redemption signals may survive reinstalling the app where platform services support them. These are not permanent hardware identifiers. Android protected local storage alone cannot reliably prevent resets after reinstalling or clearing app data.</p>
      <p>At expiry, external syncing pauses. Imported tasks remain available for local completion and blocking. Verified paid access can resume syncing within your plan’s limits.</p>

      <h2>Retention</h2>
      <p>Local tasks and preferences remain until you remove them or clear app data. Protected recovery credentials may survive uninstalling on some platforms. Server-side integration records, authorized sync metadata, diagnostic records, and trial-redemption records are retained as needed to operate the requested features, recover access, and prevent abuse. Trial records are not automatically deleted after 90 days. You can request deletion using the process below; limited records may be retained where required for security or legal obligations.</p>

      <h2>Data protection</h2>
      <ul>
        <li>Data in transit is sent over HTTPS/TLS.</li>
        <li>Google OAuth tokens stored on Android are kept in EncryptedSharedPreferences backed by the Android Keystore, using AES-256 key and value encryption schemes.</li>
        <li>Google OAuth tokens stored on iOS are kept in the Apple Keychain with this-device-only access while the device is unlocked.</li>
        <li>When the Nonlate OAuth proxy must retain tokens or webhook secrets for realtime sync, those secrets are encrypted at rest with AES-256-GCM before database storage in production.</li>
        <li>Synced task and calendar data is stored in app storage protected by the operating system sandbox. Production access to server-side systems is limited to authorized service providers and personnel who need access to operate, secure, or support Nonlate.</li>
        <li>Disconnecting a Google integration removes the stored Google OAuth credentials for that integration from the app, and Google token revocation is attempted where supported. You may also request deletion by email.</li>
      </ul>

      <h2>Sharing</h2>
      <p>Data may be processed by providers you connect and service providers needed to run the app, such as hosting, database, notification, crash-reporting, subscription validation, and platform integrity services. Some authorized server-side sync features retain task titles, due dates, and provider webhook payloads. Google user data is transferred only as needed to operate connected Google sync features, never for advertising. We do not sell personal data.</p>

      <h2>User controls</h2>
      <ul><li>Disconnect integrations in app settings.</li><li>Manage subscriptions through the store where you purchased them.</li><li>Clear local app data or uninstall the app; protected credentials and server records may require a separate deletion request.</li><li>Request data deletion by email or follow our <a href="/data-deletion/">data deletion instructions</a>.</li></ul>

      <h2>Contact</h2>
      <p>For privacy requests, contact <a href="mailto:support@nonlate.app">support@nonlate.app</a>.</p>
    </LegalPage>
  );
}
