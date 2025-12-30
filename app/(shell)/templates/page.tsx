import type { Metadata } from "next";
import { Templates } from "@/views/Templates";

export const metadata: Metadata = {
  title: "Conflict Templates to Start Faster",
  description:
    "Browse proven conflict scenarios and prefill a new case in seconds. Find the right strategy for landlords, partners, coworkers, and more.",
  alternates: { canonical: "/templates" },
  openGraph: {
    title: "Conflict Templates to Start Faster",
    description:
      "Browse proven conflict scenarios and prefill a new case in seconds. Find the right strategy for landlords, partners, coworkers, and more.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conflict Templates to Start Faster",
    description:
      "Browse proven conflict scenarios and prefill a new case in seconds. Find the right strategy for landlords, partners, coworkers, and more.",
  },
};

export default function Page() {
  return <Templates />;
}
