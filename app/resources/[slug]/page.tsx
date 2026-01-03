import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderMarkdownToHtml } from "@/lib/markdown";
import {
  getRelatedResourceArticles,
  getResourceArticleBySlug,
} from "@/lib/server/resources";
import { getSiteUrl } from "@/lib/server/site-url";

export const revalidate = 86400;

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getResourceArticleBySlug(params.slug);
  if (!article) {
    return {
      title: "Guide not found | Conflict Resolution",
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  return {
    title: `${article.title} | Resolution Library`,
    description: article.excerpt,
    alternates: { canonical: `${siteUrl}/resources/${article.slug}` },
  };
}

export default async function ResourceGuidePage({ params }: PageProps) {
  const article = await getResourceArticleBySlug(params.slug);
  if (!article) return notFound();

  const related = await getRelatedResourceArticles(article.category, article.slug, 4);
  const contentHtml = renderMarkdownToHtml(article.content_md || "");

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <Link href="/resources" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
        &lt;- Back to Library
      </Link>

      <div className="mt-6 space-y-4">
        <h1 className="text-3xl font-semibold text-slate-900">{article.title}</h1>
        <p className="text-slate-500">{article.excerpt}</p>
      </div>

      <div
        className="mt-8 space-y-6"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      <div className="mt-12 rounded-3xl border border-blue-100 bg-blue-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow text-sm font-semibold">
          CR
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          Want a response tailored to your exact situation?
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Get personalized guidance and custom scripts for your specific dynamic.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Start a Case
        </Link>
      </div>

      {related.length > 0 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Related Guides
          </h2>
          <ul className="space-y-2 text-slate-600">
            {related.map((item) => (
              <li key={item.slug}>
                <Link className="hover:text-blue-700" href={`/resources/${item.slug}`}>
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
