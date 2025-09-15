-- Debug and fix user profile issues
-- Run this in Supabase SQL Editor

-- Step 1: Check current authenticated user
SELECT auth.uid() as current_user_id;

-- Step 2: Check if current user exists in public.users table
SELECT 'User Profile Check' as check_type, 
       CASE 
         WHEN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()) 
         THEN 'EXISTS' 
         ELSE 'NOT EXISTS' 
       END as status,
       auth.uid() as user_id;

-- Step 3: If user doesn't exist, get auth.users data for comparison
SELECT 'Auth Users Data' as check_type, 
       au.id, 
       au.email, 
       au.raw_user_meta_data->>'full_name' as full_name,
       au.created_at
FROM auth.users au 
WHERE au.id = auth.uid();

-- Step 4: Check public.users table content
SELECT 'Public Users Data' as check_type, * 
FROM public.users 
WHERE id = auth.uid();

-- Step 5: If user profile missing, create it automatically
INSERT INTO public.users (id, email, full_name)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User')
FROM auth.users au
WHERE au.id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Verify user profile after insert
SELECT 'Final User Profile' as check_type, * 
FROM public.users 
WHERE id = auth.uid();