-- Clean up and fix RLS policies for Family Finance PWA
-- Run this script in Supabase SQL Editor

-- First, drop all existing policies to avoid conflicts
-- Users policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;

-- Family members policies
DROP POLICY IF EXISTS "Family members can view own memberships" ON public.family_members;
DROP POLICY IF EXISTS "Family owners can manage memberships" ON public.family_members;
DROP POLICY IF EXISTS "Users can add themselves to families they created" ON public.family_members;

-- Families policies
DROP POLICY IF EXISTS "Family members can view their family" ON public.families;
DROP POLICY IF EXISTS "Family owners can update their family" ON public.families;
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;

-- Now recreate all policies correctly
-- Users policies
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Family policies (order matters!)
CREATE POLICY "Authenticated users can create families" ON public.families FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Family members can view their family" ON public.families FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = families.id 
    AND fm.user_id = auth.uid()
  )
);
CREATE POLICY "Family owners can update their family" ON public.families FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = families.id 
    AND fm.user_id = auth.uid() 
    AND fm.role = 'owner'
  )
);

-- Family members policies (fix circular dependency)
CREATE POLICY "Family members can view own memberships" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add themselves as owners to families they created" ON public.family_members FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.families f 
    WHERE f.id = family_members.family_id 
    AND f.created_by = auth.uid()
  )
);
CREATE POLICY "Family owners can manage other memberships" ON public.family_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = family_members.family_id 
    AND fm.user_id = auth.uid() 
    AND fm.role = 'owner'
  )
);
CREATE POLICY "Family owners can delete memberships" ON public.family_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = family_members.family_id 
    AND fm.user_id = auth.uid() 
    AND fm.role = 'owner'
  )
);