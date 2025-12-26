import { createClient } from '@supabase/supabase-js';

// Fallback to prevent crash during development if keys are not set.
// The app will load, but DB operations will fail gracefully.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder-anon-key") {
  console.warn("Supabase keys are missing! Check your .env file. DB operations will fail.");
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
);
