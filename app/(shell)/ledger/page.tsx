import type { Metadata } from "next";
import { Ledger } from "@/views/Ledger";

export const metadata: Metadata = {
  title: "Session Ledger",
  description: "Review usage history and purchase confirmations for your Sessions wallet.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Ledger />;
}
