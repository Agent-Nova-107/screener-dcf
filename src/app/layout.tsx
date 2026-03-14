import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { CommandPalette } from "@/components/search/CommandPalette";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { WatchlistSyncProvider } from "@/components/providers/WatchlistSyncProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "True Stock Screener — Analyse & Valorisation Boursière",
  description:
    "Plateforme d'analyse fondamentale, screener et modèle DCF pour investisseurs exigeants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <Header />
        <CommandPalette />
        <WatchlistSyncProvider />
        <div className="flex" style={{ height: "calc(100vh - 56px)" }}>
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1200px]">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
