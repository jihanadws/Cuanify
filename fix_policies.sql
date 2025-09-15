-- Fix missing INSERT policies for Family Finance PWA
-- Run this script in Supabase SQL Editor

-- Add missing INSERT policy for users
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Add missing INSERT policy for families
CREATE POLICY "Authenticated users can create families" ON public.families FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Add missing INSERT policy for family_members (to fix circular dependency)
CREATE POLICY "Users can add themselves to families they created" ON public.family_members FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.families f 
    WHERE f.id = family_members.family_id 
    AND f.created_by = auth.uid()
  )
);