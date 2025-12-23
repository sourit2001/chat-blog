import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-noto-serif"
});

export const metadata: Metadata = {
  title: "Chat2Blog",
  description: "Turn your chats into blogs with AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chat2Blog",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // App-like feel
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.variable} ${notoSerif.variable} font-sans bg-[#151515] text-[#e5e5e5] antialiased`}>
        {children}
      </body>
    </html>
  );
}
