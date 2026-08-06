import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "./components/LegalPage";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you requested could not be found.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function NotFound() {
  return (
    <LegalPage
      eyebrow="404 · Page not found"
      title="This deadline slipped past us."
      description="The page you requested does not exist. The safest way forward is back to Nonlate."
    >
      <Link className="button-primary" href="/">Return home</Link>
    </LegalPage>
  );
}
