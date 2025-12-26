# Vercel Notes

## Required Environment Variables
- NEXT_PUBLIC_SITE_URL
  - Public canonical base URL, used for metadata and absolute links.
  - Example: https://conflictresolution.ai
- NEXT_PUBLIC_SUPABASE_URL
  - Supabase project URL for client usage.
- NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Supabase anon public key for client usage.
- API_KEY
  - Google Gemini API key (server-side only).

## Recommended Vercel Env Setup
- Development
  - NEXT_PUBLIC_SITE_URL = http://localhost:3000
  - NEXT_PUBLIC_SUPABASE_URL = <your supabase url>
  - NEXT_PUBLIC_SUPABASE_ANON_KEY = <your supabase anon key>
  - API_KEY = <your gemini api key>
- Preview
  - NEXT_PUBLIC_SITE_URL = https://<your-preview-domain>
  - NEXT_PUBLIC_SUPABASE_URL = <your supabase url>
  - NEXT_PUBLIC_SUPABASE_ANON_KEY = <your supabase anon key>
  - API_KEY = <your gemini api key>
- Production
  - NEXT_PUBLIC_SITE_URL = https://conflictresolution.ai (or final production domain)
  - NEXT_PUBLIC_SUPABASE_URL = <your supabase url>
  - NEXT_PUBLIC_SUPABASE_ANON_KEY = <your supabase anon key>
  - API_KEY = <your gemini api key>

## Canonical URL Strategy
- Use NEXT_PUBLIC_SITE_URL for canonical metadata and open graph URLs.
- Do not rely solely on VERCEL_URL for canonical production domain.
- For previews, fall back to VERCEL_URL only when NEXT_PUBLIC_SITE_URL is not set.
