import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nonlate.app"),
  title: {
    default: "Nonlate App | Deadline-Aware App Blocker",
    template: "%s | Nonlate",
  },
  description:
    "Nonlate is a deadline-aware app blocker for iOS and Android that combines manual and synced tasks, planning, schedules, alarms, and distraction blocking.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/assets/brand/favicon.ico", sizes: "any" },
      { url: "/assets/brand/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/assets/brand/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Nonlate",
    title: "Nonlate App | Know what’s due before you scroll.",
    description: "A deadline-aware app blocker for iOS and Android that puts real due work before selected distractions.",
    url: "/",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Nonlate deadline blockers on iOS and Android" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nonlate App | Know what’s due before you scroll.",
    description: "A deadline-aware app blocker for iOS and Android that puts real due work before selected distractions.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#070914",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${jetbrains.variable}`}>{children}</body>
    </html>
  );
}
