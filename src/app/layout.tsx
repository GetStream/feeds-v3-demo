import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/queryProvider";
import Whatshappening from "@/components/whatshappening";
import Sidebar from "@/components/sidebar";
import { WhoToFollow } from "@/components/whotofollow";
import { Toaster } from "react-hot-toast";

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
        <QueryProvider>
          <main className="grid grid-cols-[280px_auto_350px] gap-5 min-h-screen bg-black mx-auto w-[1280px]">
            {/* Sidebar */}
            <div className="flex-[0.25] border-r border-gray-800">
              <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Feed Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto">{children}</div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="flex-[0.3] hidden xl:block p-4 border-l border-gray-800">
              <div className="sticky top-4">
                <Whatshappening />
                <WhoToFollow />
              </div>
            </div>
          </main>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(255,255,255,0.1)",
                color: "white",
                padding: "15px",
                backdropFilter: "blur(10px)",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
