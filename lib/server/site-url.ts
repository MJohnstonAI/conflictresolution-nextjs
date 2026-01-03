const DEFAULT_SITE_URL = "https://resolvethedisputes.com";

const normalizeSiteUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).toString().replace(/\/$/, "");
  } catch {
    try {
      return new URL(`https://${trimmed}`).toString().replace(/\/$/, "");
    } catch {
      return null;
    }
  }
};

export const getSiteUrl = () =>
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? DEFAULT_SITE_URL;
