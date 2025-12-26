
# Admin Setup Instructions

To grant yourself permanent admin rights (bypassing all round limits and unlocking premium features), run the following SQL queries in your Supabase SQL Editor.

### 1. Update Database Schema
First, add the `is_admin` column to the `profiles` table.

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
```

### 2. Grant Yourself Admin Rights
Replace `'YOUR_EMAIL_HERE'` with the email address you use to log in.

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'YOUR_EMAIL_HERE';
```

### 3. Verification
Run this to confirm you are now an admin:

```sql
SELECT id, email, is_admin FROM public.profiles WHERE is_admin = true;
```

Once this is done, refresh the application. You will see an **"Admin Mode"** indicator in the War Room header, and you will no longer face any round limits or feature locks.
