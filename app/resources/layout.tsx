import type { ReactNode } from "react";
import PublicSiteLayout from "@/components/public-site-layout";

export default function ResourcesLayout({ children }: { children: ReactNode }) {
  return <PublicSiteLayout activeNav="library">{children}</PublicSiteLayout>;
}
