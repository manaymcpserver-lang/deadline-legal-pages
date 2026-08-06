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
    default: "Nonlate | Know what’s due before you scroll.",
    template: "%s | Nonlate",
  },
  description:
    "Nonlate gathers deadlines from school, work, calendars, and task tools, then steps in when a chosen distraction opens.",
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
    title: "Know what’s due before you scroll.",
    description: "Your real deadlines, gathered and ready before distractions take over.",
    url: "/",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Nonlate deadline blockers on iOS and Android" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Know what’s due before you scroll.",
    description: "Your real deadlines, gathered and ready before distractions take over.",
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
