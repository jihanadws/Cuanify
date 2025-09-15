-- Complete RLS and Policies Setup for Family Finance PWA
-- Run this entire script in Supabase SQL Editor

-- STEP 1: Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- STEP 3: Create Users policies
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 4: Create Families policies (order matters!)
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

-- STEP 5: Create Family Members policies (fix circular dependency)
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

-- STEP 6: Create other table policies
-- Accounts policies
CREATE POLICY "Family members can view family accounts" ON public.accounts FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create accounts" ON public.accounts FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update accounts" ON public.accounts FOR UPDATE USING (user_has_family_access(family_id));
CREATE POLICY "Family members can delete accounts" ON public.accounts FOR DELETE USING (user_has_family_access(family_id));

-- Categories policies
CREATE POLICY "Family members can view family categories" ON public.categories FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create categories" ON public.categories FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update categories" ON public.categories FOR UPDATE USING (user_has_family_access(family_id));
CREATE POLICY "Family members can delete categories" ON public.categories FOR DELETE USING (user_has_family_access(family_id));

-- Transactions policies
CREATE POLICY "Family members can view family transactions" ON public.transactions FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create transactions" ON public.transactions FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update own transactions" ON public.transactions FOR UPDATE USING (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can delete own transactions" ON public.transactions FOR DELETE USING (user_has_family_access(family_id) AND auth.uid() = created_by);

-- Budgets policies
CREATE POLICY "Family members can view family budgets" ON public.budgets FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create budgets" ON public.budgets FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update budgets" ON public.budgets FOR UPDATE USING (user_has_family_access(family_id));
CREATE POLICY "Family members can delete budgets" ON public.budgets FOR DELETE USING (user_has_family_access(family_id));

-- Goals policies
CREATE POLICY "Family members can view family goals" ON public.goals FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create goals" ON public.goals FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update goals" ON public.goals FOR UPDATE USING (user_has_family_access(family_id));
CREATE POLICY "Family members can delete goals" ON public.goals FOR DELETE USING (user_has_family_access(family_id));

-- STEP 7: Verify setup
SELECT 'RLS Status' as check_type, schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'families', 'family_members', 'accounts', 'categories', 'transactions')
ORDER BY tablename;

SELECT 'Policy Count' as check_type, tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
ORDER BY tablename;