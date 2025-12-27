import type { Metadata } from "next";
import { Testimonials } from "@/views/Testimonials";

export const metadata: Metadata = {
  title: "Success Stories",
  description: "Read how others are resolving conflicts using Conflict Resolution.",
};

export default function Page() {
  return <Testimonials />;
}
