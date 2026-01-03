"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type ResourceSummary = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
};

const normalize = (value: string) => value.toLowerCase();

export default function ResourcesIndex({
  articles,
  categories,
}: {
  articles: ResourceSummary[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Guides");

  const filtered = useMemo(() => {
    const lowerQuery = normalize(query);
    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === "All Guides" || article.category === activeCategory;
      const matchesQuery =
        !lowerQuery ||
        normalize(article.title).includes(lowerQuery) ||
        normalize(article.excerpt).includes(lowerQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, articles, query]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Categories</h2>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                placeholder="Search categories"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              {["All Guides", ...categories].map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "hover:bg-slate-100 text-slate-600"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Conflict Resolution Library</h1>
          <p className="mt-2 text-slate-500">
            Practical guides and example messages for common disputes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["All Guides", ...categories].map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-wide ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((article) => (
            <div
              key={article.slug}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                {article.category}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{article.title}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-500">{article.excerpt}</p>
              <Link
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                href={`/resources/${article.slug}`}
              >
                Read guide -&gt;
              </Link>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Looking for personalized advice?{" "}
          <Link className="font-semibold text-blue-600 hover:text-blue-700" href="/">
            Start a case.
          </Link>
        </div>
      </section>
    </div>
  );
}
