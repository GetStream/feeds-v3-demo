import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { StreamProvider, FollowersProvider } from "../contexts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FeedsApp - Real-time Social Feed",
  description: "A modern Twitter-like app built with Stream SDK and Next.js",
  keywords: ["social media", "real-time", "feeds", "stream", "nextjs"],
  authors: [{ name: "FeedsApp Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        <StreamProvider>
          <FollowersProvider>
            {children}
          </FollowersProvider>
        </StreamProvider>
      </body>
    </html>
  );
}
