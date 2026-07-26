import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "鉑魅兒 Bo Mei Er",
  description: "手作琉璃手機鏈與配飾選物。每一件都保留手作細節，適合日常配戴與送禮。",
  openGraph: {
    title: "鉑魅兒 Bo Mei Er",
    description: "手作琉璃手機鏈與配飾選物。每一件都保留手作細節，適合日常配戴與送禮。",
    images: ["/images/brand/og-image.jpg"],
    locale: "zh_TW",
    type: "website",
  },
  icons: {
    icon: "/images/brand/logo-icon-64.png",
    shortcut: "/images/brand/logo-icon-64.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
