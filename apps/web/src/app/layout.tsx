import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quorum — AI-Native Video Meetings",
  description:
    "The meeting platform where an AI participant sits at the table. Ask it anything, get sourced answers, live.",
  keywords: ["video meetings", "AI", "collaboration", "fact-checking", "Quorum", "AI meetings"],
  openGraph: {
    title: "Quorum — AI-Native Video Meetings",
    description:
      "The first video platform with a real AI participant in every room. Ask questions, check facts, get sourced answers — live.",
    type: "website",
    siteName: "Quorum",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quorum — AI-Native Video Meetings",
    description:
      "The first video platform with a real AI participant in every room.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
