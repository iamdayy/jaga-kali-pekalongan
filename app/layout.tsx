import type { Metadata } from "next";
import type React from "react";

import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

import SplashScreenWrapper from "@/components/splash-screen-wrapper";
import {
  Geist as Font_Geist,
  Geist_Mono as Font_Geist_Mono,
  Source_Serif_4 as Font_Source_Serif_4,
} from "next/font/google";

// Initialize fonts
const _geist = Font_Geist({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
const _geistMono = Font_Geist_Mono({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});
const _sourceSerif_4 = Font_Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Jaga Kali Pekalongan - Platform Pelaporan Sampah Sungai",
  description:
    "Platform interaktif untuk melaporkan dan melacak sampah serta limbah di Sungai Pekalongan. Bersama kita jaga kelestarian sungai.",
  icons: {
    icon: [
      {
        url: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`font-sans antialiased`}>
        <SplashScreenWrapper />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
