import type { Metadata } from "next";
import { Templates } from "@/views/Templates";

export const metadata: Metadata = {
  title: "Template Library",
  description: "Start faster with prebuilt conflict scenarios and case templates.",
};

export default function Page() {
  return <Templates />;
}
