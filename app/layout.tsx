import type { Metadata, Viewport } from "next";
import { brand } from "@/data/site";
import "./globals.css";

const faviconVersion = "20260721-navy-v3";
const faviconUrl = `/favicon.svg?v=${faviconVersion}`;
const darkFaviconUrl = `/favicon-dark.svg?v=${faviconVersion}`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ggomggombath.com"),
  applicationName: "꼼꼼욕실",
  title: {
    default: "꼼꼼욕실 | 서울·인천·경기 욕실 부분시공 전문",
    template: "%s | 꼼꼼욕실",
  },
  description: "변기, 세면기, 수전, 욕실장 교체부터 욕실 액세서리 설치까지. 서울·인천·경기 욕실 부분시공 전문 꼼꼼욕실입니다.",
  keywords: ["욕실 부분시공", "변기 교체", "세면기 교체", "욕실 수전 교체", "욕실장 교체", "서울 욕실 시공", "경기 욕실 시공"],
  alternates: { types: { "application/rss+xml": "/rss.xml" } },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "꼼꼼욕실",
    title: "바꿔야 할 곳만, 꼼꼼하게 | 꼼꼼욕실",
    description: "서울·인천·경기 욕실 부분시공 전문. 필요한 곳만 정확하고 깔끔하게 교체합니다.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "서울·인천·경기 욕실 부분시공 꼼꼼욕실" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "바꿔야 할 곳만, 꼼꼼하게 | 꼼꼼욕실",
    description: "서울·인천·경기 욕실 부분시공 전문",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: faviconUrl, type: "image/svg+xml" },
      { url: darkFaviconUrl, type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
    shortcut: faviconUrl,
    apple: brand.logoPath,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b4f7b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
