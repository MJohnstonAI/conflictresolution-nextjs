import type { Metadata } from "next";
import { Help } from "@/views/Help";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Guides, FAQs, and support resources for Conflict Resolution.",
};

export default function Page() {
  return <Help />;
}
