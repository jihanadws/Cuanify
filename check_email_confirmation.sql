-- Check email confirmation status and fix it
-- Run this in Supabase SQL Editor

-- Step 1: Check all users and their email confirmation status
SELECT 'User Email Status' as info,
       id, 
       email, 
       email_confirmed_at,
       CASE 
         WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED'
         ELSE 'CONFIRMED'
       END as status,
       created_at
FROM auth.users 
ORDER BY created_at DESC;

-- Step 2: Check Supabase auth settings (if accessible)
-- Note: This might not work depending on permissions
SELECT 'Auth Settings' as info, 
       CASE 
         WHEN current_setting('app.settings.auth.enable_signup', true) = 'true' THEN 'Signup Enabled'
         ELSE 'Signup Disabled'
       END as signup_status;

-- Step 3: Manually confirm emails for development (ONLY FOR DEVELOPMENT!)
-- UNCOMMENT TO ENABLE:
/*
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL
  AND created_at > NOW() - INTERVAL '1 day';  -- Only recent users
*/

-- Step 4: Check users in public.users table
SELECT 'Public Users' as info, * FROM public.users ORDER BY created_at DESC;