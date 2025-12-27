import type { Metadata } from "next";
import { UnlockCase } from "@/views/UnlockCase";

export const metadata: Metadata = {
  title: "Case File Store",
  description: "Purchase and manage Standard and Premium case credits.",
};

export default function Page() {
  return <UnlockCase />;
}
