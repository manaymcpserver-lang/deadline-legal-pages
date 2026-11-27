import type { Metadata } from "next";

const previewImage = {
  url: "/og-launch-2026-10.png",
  width: 1536,
  height: 1024,
  alt: "Nonlate deadline blockers on iOS and Android",
};

export function legalMetadata(title: string, description: string, path: string): Metadata {
  const preview = { title: `${title} | Nonlate`, description };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...preview,
      type: "website",
      siteName: "Nonlate",
      url: path,
      images: [previewImage],
    },
    twitter: { ...preview, card: "summary_large_image", images: [previewImage.url] },
  };
}
