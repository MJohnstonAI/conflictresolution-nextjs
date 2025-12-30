import type { Metadata } from "next";
import { Help } from "@/views/Help";

export const metadata: Metadata = {
  title: "Help Center & Strategy Guide",
  description:
    "Step-by-step guidance, FAQs, and conflict strategy tips for faster, calmer responses.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: "Help Center & Strategy Guide",
    description:
      "Step-by-step guidance, FAQs, and conflict strategy tips for faster, calmer responses.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Help Center & Strategy Guide",
    description:
      "Step-by-step guidance, FAQs, and conflict strategy tips for faster, calmer responses.",
  },
};

export default function Page() {
  return <Help />;
}
