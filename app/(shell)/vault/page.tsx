import type { Metadata } from "next";
import { Vault } from "@/views/Vault";

export const metadata: Metadata = {
  title: "Case Vault",
  description: "Review, export, and manage your saved conflict cases.",
};

export default function Page() {
  return <Vault />;
}
