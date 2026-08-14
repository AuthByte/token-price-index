import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: "The Token Index",
  description:
    "A usage-weighted price of the tokens the world actually spends, built from OpenRouter’s most-used models.",
  metadataBase: new URL("https://token-price-index.vercel.app"),
  openGraph: {
    title: "The Token Index",
    description:
      "Usage-weighted token prices from OpenRouter’s most-used models. Index 100 equals $1 per million tokens.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
