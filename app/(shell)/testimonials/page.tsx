import type { Metadata } from "next";
import { Testimonials } from "@/views/Testimonials";

export const metadata: Metadata = {
  title: "Success Stories & Outcomes",
  description:
    "Real-world outcomes from people who used Conflict Resolution to de-escalate and solve hard conversations.",
  alternates: { canonical: "/testimonials" },
  openGraph: {
    title: "Success Stories & Outcomes",
    description:
      "Real-world outcomes from people who used Conflict Resolution to de-escalate and solve hard conversations.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Success Stories & Outcomes",
    description:
      "Real-world outcomes from people who used Conflict Resolution to de-escalate and solve hard conversations.",
  },
};

export default function Page() {
  return <Testimonials />;
}
