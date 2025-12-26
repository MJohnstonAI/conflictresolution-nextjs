
# Fix Authentication & Profiles (Production Verified)

Run this entire block in your Supabase SQL Editor. 
This script ensures that when a user signs up, their secure profile is created with all features (Standard/Premium/Trial) ready to go.

```sql
-- 1. Ensure the profiles table has all required columns
-- This adds missing columns if they don't exist yet.
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_trial boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS standard_credits int DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_credits int DEFAULT 0;

-- 2. Create the Trigger Function
-- This captures the 'full_name' you entered in the signup form.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    premium_credits, 
    standard_credits, 
    is_admin,
    is_trial,
    theme
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    0, 
    0, 
    false,
    false,
    'dark'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own data
DROP POLICY IF EXISTS "Self View" ON public.profiles;
CREATE POLICY "Self View" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own preferences (like theme)
DROP POLICY IF EXISTS "Self Update" ON public.profiles;
CREATE POLICY "Self Update" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- 5. Diagnostic: Run this to check if your current user has a profile
-- SELECT * FROM public.profiles WHERE email = 'your-email@example.com';
```
