import type { Metadata } from "next";
import { DemoSelect } from "@/views/DemoSelect";

export const metadata: Metadata = {
  title: "Demo Mode",
  description: "Try scripted scenarios in Demo Mode (no AI calls).",
};

export default function Page() {
  return <DemoSelect />;
}
