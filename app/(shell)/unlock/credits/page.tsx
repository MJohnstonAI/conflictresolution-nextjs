import type { Metadata } from "next";
import { UnlockCase } from "@/views/UnlockCase";

export const metadata: Metadata = {
  title: "Sessions Store",
  description: "Purchase and manage Standard and Premium sessions.",
};

export default function Page() {
  return <UnlockCase />;
}
