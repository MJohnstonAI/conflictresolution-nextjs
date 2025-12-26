
# SQL Update: Unified Credit Wallet

Run this script in your Supabase SQL Editor to allow users to hold both Standard and Premium credits simultaneously.

```sql
-- 1. Add standard_credits column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS standard_credits int DEFAULT 0;

-- 2. Update existing users (optional cleanup)
-- Ensure no null values exist
UPDATE public.profiles 
SET standard_credits = 0 
WHERE standard_credits IS NULL;
```
