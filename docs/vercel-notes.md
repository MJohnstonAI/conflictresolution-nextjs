# Vercel Notes

## Required Environment Variables
- NEXT_PUBLIC_SITE_URL
  - Public canonical base URL, used for metadata and absolute links.
  - Example: https://conflictresolution.ai
- NEXT_PUBLIC_SUPABASE_URL
  - Supabase project URL for client usage.
- NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Supabase anon public key for client usage.
- OPENROUTER_API_KEY
  - OpenRouter API key (server-side only).
- SUPABASE_SERVICE_ROLE_KEY
  - Supabase service role key (server-side only).

## Recommended Vercel Env Setup
- Development
  - NEXT_PUBLIC_SITE_URL = http://localhost:3000
  - NEXT_PUBLIC_SUPABASE_URL = <your supabase url>
  - NEXT_PUBLIC_SUPABASE_ANON_KEY = <your supabase anon key>
  - OPENROUTER_API_KEY = <your openrouter api key>
  - SUPABASE_SERVICE_ROLE_KEY = <your supabase service role key>
- Preview
  - NEXT_PUBLIC_SITE_URL = https://<your-preview-domain>
  - NEXT_PUBLIC_SUPABASE_URL = <your supabase url>
  - NEXT_PUBLIC_SUPABASE_ANON_KEY = <your supabase anon key>
  - OPENROUTER_API_KEY = <your openrouter api key>
  - SUPABASE_SERVICE_ROLE_KEY = <your supabase service role key>
- Production
  - NEXT_PUBLIC_SITE_URL = https://conflictresolution.ai (or final production domain)
  - NEXT_PUBLIC_SUPABASE_URL = <your supabase url>
  - NEXT_PUBLIC_SUPABASE_ANON_KEY = <your supabase anon key>
  - OPENROUTER_API_KEY = <your openrouter api key>
  - SUPABASE_SERVICE_ROLE_KEY = <your supabase service role key>

## Canonical URL Strategy
- Use NEXT_PUBLIC_SITE_URL for canonical metadata and open graph URLs.
- Do not rely solely on VERCEL_URL for canonical production domain.
- For previews, fall back to VERCEL_URL only when NEXT_PUBLIC_SITE_URL is not set.
