import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "鉑魅兒 Bo Mei Er",
  description: "手作手機鏈與配飾選物商品網站。",
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
