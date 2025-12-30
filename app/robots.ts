import type { MetadataRoute } from "next";

const getSiteUrl = () => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
};

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/vault", "/case/", "/auth", "/unlock/credits", "/ledger", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
