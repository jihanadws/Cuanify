-- FIX INFINITE RECURSION - Policies yang lebih simple dan aman
-- Error 42P17 terjadi karena policy saling referensi antar tabel

-- 1. DROP semua policies untuk reset total
DROP POLICY IF EXISTS "families_authenticated_insert" ON public.families;
DROP POLICY IF EXISTS "families_authenticated_select" ON public.families;
DROP POLICY IF EXISTS "families_authenticated_update" ON public.families;
DROP POLICY IF EXISTS "families_authenticated_delete" ON public.families;

DROP POLICY IF EXISTS "family_members_authenticated_insert" ON public.family_members;
DROP POLICY IF EXISTS "family_members_authenticated_select" ON public.family_members;
DROP POLICY IF EXISTS "family_members_authenticated_update" ON public.family_members;
DROP POLICY IF EXISTS "family_members_authenticated_delete" ON public.family_members;

-- 2. Buat policies SIMPLE tanpa cross-table reference untuk families
CREATE POLICY "families_owner_all" ON public.families
    FOR ALL 
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- 3. Buat policies SIMPLE untuk family_members (tanpa lookup ke families table)
CREATE POLICY "family_members_own_record" ON public.family_members
    FOR ALL 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Pastikan RLS enabled
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 5. Test query untuk memastikan tidak ada recursion
-- SELECT * FROM public.families WHERE created_by = auth.uid();
-- SELECT * FROM public.family_members WHERE user_id = auth.uid();