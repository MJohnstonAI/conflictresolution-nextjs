import type { MetadataRoute } from "next";
import { getResourceSlugs } from "@/lib/server/resources";
import { getSiteUrl } from "@/lib/server/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const resources = await getResourceSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: new Date() },
    { url: `${siteUrl}/resources`, lastModified: new Date() },
  ];

  const resourceRoutes = resources.map((item) => ({
    url: `${siteUrl}/resources/${item.slug}`,
    lastModified: item.updated_at ? new Date(item.updated_at) : new Date(),
  }));

  return [...staticRoutes, ...resourceRoutes];
}
