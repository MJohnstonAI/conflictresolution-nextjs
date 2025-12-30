import type { Metadata } from "next";
import { WarRoom } from "@/views/WarRoom";

export const metadata: Metadata = {
  title: "War Room",
  description: "Analyze messages, detect tactics, and draft strategic responses.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <WarRoom />;
}
