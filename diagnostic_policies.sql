-- Diagnostic script to check ALL RLS policies status including categories
-- Run this in Supabase SQL Editor to see current policies

-- Check if tables have RLS enabled (compatible with Supabase PostgreSQL)
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'families', 'family_members', 'categories', 'transactions')
ORDER BY tablename;

-- Check for triggers on families table that might affect categories
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'families' AND event_object_schema = 'public';

-- Check existing policies for categories table (BARU!)
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'categories'
ORDER BY policyname;

-- Check categories table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'categories' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check existing policies for users table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- Check existing policies for families table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'families'
ORDER BY policyname;

-- Check existing policies for family_members table
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'family_members'
ORDER BY policyname;

-- Check if our functions exist
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('user_has_family_access', 'generate_family_code', 'create_default_categories');