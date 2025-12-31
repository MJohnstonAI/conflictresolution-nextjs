import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://resolvethedisputes.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Conflict Resolution - AI Conflict Management & Negotiation Strategy",
  description:
    "AI-powered conflict coaching tool. Analyze disputes, detect manipulation, and draft strategic responses (Peacekeeper, Barrister, or Nuclear) for landlords, relationships, and work.",
  keywords: [
    "conflict resolution",
    "ai negotiation",
    "dispute resolution",
    "coparenting app",
    "landlord dispute",
    "narcissistic abuse",
    "difficult conversations",
    "negotiation strategy",
  ],
  authors: [{ name: "NeuroSyncTeam AI Dynamics" }],
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "https://cdn-icons-png.flaticon.com/512/9313/9313215.png",
  },
  openGraph: {
    title: "Conflict Resolution - AI Strategy Console",
    description:
      "Don't text angry. Use AI to analyze conflicts and draft the perfect response to win arguments or save relationships.",
    url: siteUrl,
    type: "website",
    images: ["https://cdn-icons-png.flaticon.com/512/9313/9313215.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Conflict Resolution - AI Strategy Console",
    description: "Don't text angry. Use AI to analyze conflicts and draft the perfect response.",
    images: ["https://cdn-icons-png.flaticon.com/512/9313/9313215.png"],
  },
};

export const viewport = {
  themeColor: "#020617",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
