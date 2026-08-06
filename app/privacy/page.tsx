import type { Metadata } from "next";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What information Nonlate processes, how it is used, and the controls available to you.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" description="This policy explains what information Nonlate processes and how it is used." updated="July 22, 2026" currentHref="/privacy/">
      <p>Nonlate is built around the smallest practical amount of data needed to sync deadlines and show focus reminders.</p>

      <h2>What we process</h2>
      <ul>
        <li>Connection data for integrations you choose to connect.</li>
        <li>Task and calendar metadata needed for app features, such as title, due date, source, and completion status.</li>
        <li>App settings and focus preferences.</li>
        <li>Ad consent choices and ad delivery data.</li>
        <li>Birth month and year stored on your device to determine age-appropriate ad eligibility. Nonlate does not send this value to advertising providers.</li>
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
        <li>Serve ads and apply privacy choices for ad-consent data. Google user data is not used for advertising.</li>
        <li>Keep the app reliable and secure.</li>
      </ul>

      <h2>Advertising and privacy choices</h2>
      <p>Eligible adults using the free version of Nonlate may see compact native ads provided by Google AdMob. Ad personalization is optional. Where applicable, Nonlate asks for your advertising privacy choice only after you have used the app for a period of time rather than during onboarding.</p>
      <ul>
        <li>If you allow personalized advertising, Google may use permitted advertising identifiers and consent information to select ads.</li>
        <li>If you decline personalization, or applicable rules require it, Nonlate may request non-personalized or limited ads when Google’s consent system permits them.</li>
        <li>Paid users, users whose age is unknown, and users identified as under 16 do not receive ads or an advertising-personalization prompt from Nonlate.</li>
        <li>On iOS, Nonlate may show Apple’s tracking-permission prompt after an explanation when that permission is relevant. Declining that permission does not prevent you from using the app.</li>
        <li>Where required, you can review or change available advertising choices from the Ad privacy choices item in app settings.</li>
      </ul>
      <p>Google user data imported through connected Google services is never used for advertising. For more information about how Google processes advertising data, see <a href="https://policies.google.com/technologies/ads">Google’s advertising privacy information</a>.</p>

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
      <p>Data may be shared with providers you connect and service providers needed to run the app, such as hosting, database, notification, crash-reporting, ads, and consent tools. Google user data is shared only as needed to operate connected Google sync features and is not shared with advertising providers. We do not sell personal data.</p>

      <h2>User controls</h2>
      <ul><li>Disconnect integrations in app settings.</li><li>Review available advertising privacy choices in app settings.</li><li>Uninstall the app to remove local app data on your device.</li><li>Request data deletion by email.</li></ul>

      <h2>Contact</h2>
      <p>For privacy requests, contact <a href="mailto:support@nonlate.app">support@nonlate.app</a>.</p>
    </LegalPage>
  );
}
