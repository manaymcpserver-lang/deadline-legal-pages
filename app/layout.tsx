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
    "Nonlate brings tasks, calendars, and supported connected sources into one plan, then blocks selected distractions when work is due. Built for iOS and Android.",
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
    title: "Nonlate | More connected. Less distracted.",
    description: "Stay ahead of what’s due. Bring manual and connected tasks together, plan your day, and interrupt selected distractions when work needs attention.",
    url: "/",
    images: [{ url: "/og-launch-2026-10.png", width: 1536, height: 1024, alt: "Nonlate deadline blockers on iOS and Android" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nonlate | More connected. Less distracted.",
    description: "Stay ahead of what’s due. Bring manual and connected tasks together, plan your day, and interrupt selected distractions when work needs attention.",
    images: ["/og-launch-2026-10.png"],
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
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${jetbrains.variable}`}>{children}</body>
    </html>
  );
}
