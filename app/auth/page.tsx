import type { Metadata } from "next";
import { Auth } from "@/views/Auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in or create an account to save cases to your vault.",
};

export default function Page() {
  return <Auth />;
}
