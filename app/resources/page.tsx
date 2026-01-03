import type { Metadata } from "next";
import ResourcesIndex from "./ResourcesIndex";
import { getResourceArticles } from "@/lib/server/resources";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Resolution Library | Conflict Resolution",
  description: "Practical guides and example scripts for common conflict scenarios.",
  alternates: { canonical: "/resources" },
};

export default async function ResourcesPage() {
  const articles = await getResourceArticles();
  const categories = Array.from(new Set(articles.map((article) => article.category))).sort();

  return (
    <ResourcesIndex
      articles={articles.map((article) => ({
        slug: article.slug,
        category: article.category,
        title: article.title,
        excerpt: article.excerpt,
      }))}
      categories={categories}
    />
  );
}
