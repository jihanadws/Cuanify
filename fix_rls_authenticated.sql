-- SOLUSI DEFINITIF: RLS Policies untuk Authenticated Role
-- Masalah: SQL Editor pakai service role (bypass RLS), App pakai authenticated role (enforce RLS)

-- 1. Drop semua policies lama
DROP POLICY IF EXISTS "families_full_access" ON public.families;
DROP POLICY IF EXISTS "family_members_full_access" ON public.family_members;

-- 2. Buat policies yang benar untuk authenticated users
-- Untuk families table:
CREATE POLICY "families_authenticated_insert" ON public.families
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "families_authenticated_select" ON public.families
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = created_by OR 
        auth.uid() IN (
            SELECT user_id FROM public.family_members WHERE family_id = id
        )
    );

CREATE POLICY "families_authenticated_update" ON public.families
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "families_authenticated_delete" ON public.families
    FOR DELETE 
    TO authenticated
    USING (auth.uid() = created_by);

-- Untuk family_members table:
CREATE POLICY "family_members_authenticated_insert" ON public.family_members
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT created_by FROM public.families WHERE id = family_id
        )
    );

CREATE POLICY "family_members_authenticated_select" ON public.family_members
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT created_by FROM public.families WHERE id = family_id
        )
    );

CREATE POLICY "family_members_authenticated_update" ON public.family_members
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "family_members_authenticated_delete" ON public.family_members
    FOR DELETE 
    TO authenticated
    USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT created_by FROM public.families WHERE id = family_id
        )
    );

-- 3. Pastikan RLS enabled
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 4. Test dengan manual insert using authenticated context (tidak akan work di SQL Editor karena pakai service role)
-- INSERT INTO public.families (name, created_by) VALUES ('Test Authenticated', auth.uid());