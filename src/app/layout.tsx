import type { Metadata, Viewport } from "next";
import { Press_Start_2P, DotGothic16 } from "next/font/google";
import { AuthGuard } from "@/components/AuthGuard";
import { HeaderProfile } from "@/components/HeaderProfile";
import { PixelSceneBackground } from "@/components/PixelSceneBackground";
import "./globals.css";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-cute-cn",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#B8D4F0",
};

export const metadata: Metadata = {
  title: "LZY's Diary",
  description: "私密日记、纪念日倒计时、云相册，三端同步",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LZY's Diary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${pressStart.variable} ${dotGothic.variable}`}>
      <body className="min-h-screen bg-tint-blue-strong text-stardew-dark antialiased font-cute-cn flex flex-col relative">
        <PixelSceneBackground />
        <header className="relative z-20"><HeaderProfile /></header>
        <div className="flex-1 min-h-0 relative z-10">
          <AuthGuard>{children}</AuthGuard>
        </div>
      </body>
    </html>
  );
}
