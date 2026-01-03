import { createClient } from "@supabase/supabase-js";
import { cleanEnvValue } from "@/lib/server/env";

export type ResourceArticle = {
  id: string;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  content_md?: string;
  updated_at: string;
  created_at: string;
};

const supabaseUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabasePublic =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

const emptyList: ResourceArticle[] = [];

export const getResourceArticles = async (): Promise<ResourceArticle[]> => {
  if (!supabasePublic) return emptyList;
  const { data, error } = await supabasePublic
    .from("resource_articles")
    .select("id, slug, category, title, excerpt, updated_at, created_at")
    .eq("published", true)
    .order("updated_at", { ascending: false });
  if (error || !data) return emptyList;
  return data;
};

export const getResourceArticleBySlug = async (slug: string): Promise<ResourceArticle | null> => {
  if (!supabasePublic || !slug) return null;
  const { data, error } = await supabasePublic
    .from("resource_articles")
    .select("id, slug, category, title, excerpt, content_md, updated_at, created_at")
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return data;
};

export const getRelatedResourceArticles = async (
  category: string,
  excludeSlug: string,
  limit = 4
): Promise<ResourceArticle[]> => {
  if (!supabasePublic || !category) return emptyList;
  const { data, error } = await supabasePublic
    .from("resource_articles")
    .select("id, slug, category, title, excerpt, updated_at, created_at")
    .eq("published", true)
    .eq("category", category)
    .neq("slug", excludeSlug)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error || !data) return emptyList;
  return data;
};

export const getResourceSlugs = async (): Promise<Array<{ slug: string; updated_at: string }>> => {
  if (!supabasePublic) return [];
  const { data, error } = await supabasePublic
    .from("resource_articles")
    .select("slug, updated_at")
    .eq("published", true)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data;
};
