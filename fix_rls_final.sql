-- FINAL FIX untuk RLS Policies berdasarkan test sukses
-- Test manual insert berhasil, sekarang buat policy yang benar

-- 1. Hapus semua policies lama yang mungkin conflict
DROP POLICY IF EXISTS "families_insert_policy" ON public.families;
DROP POLICY IF EXISTS "families_select_policy" ON public.families;
DROP POLICY IF EXISTS "families_update_policy" ON public.families;
DROP POLICY IF EXISTS "families_delete_policy" ON public.families;

DROP POLICY IF EXISTS "family_members_insert_policy" ON public.family_members;
DROP POLICY IF EXISTS "family_members_select_policy" ON public.family_members;
DROP POLICY IF EXISTS "family_members_update_policy" ON public.family_members;
DROP POLICY IF EXISTS "family_members_delete_policy" ON public.family_members;

-- 2. Pastikan RLS enabled
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 3. Buat policies yang simple dan permissive dulu untuk families
CREATE POLICY "families_full_access" ON public.families
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 4. Buat policies yang simple dan permissive dulu untuk family_members  
CREATE POLICY "family_members_full_access" ON public.family_members
    FOR ALL
    USING (true) 
    WITH CHECK (true);

-- 5. Test insert lagi dengan RLS enabled tapi policy permissive
-- Jalankan ini di aplikasi untuk test
-- INSERT INTO public.families (name, created_by) VALUES ('Test App Insert', auth.uid());

-- 6. Setelah sukses, nanti kita bisa bikin policies yang lebih ketat:
-- CREATE POLICY "families_user_access" ON public.families
--     FOR ALL
--     USING (auth.uid() = created_by OR auth.uid() IN (
--         SELECT user_id FROM public.family_members WHERE family_id = id
--     ))
--     WITH CHECK (auth.uid() = created_by);