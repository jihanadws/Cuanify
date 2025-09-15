-- FIX Categories table RLS policy untuk default categories creation
-- Error terjadi karena trigger setup_new_family() mencoba insert categories

-- 1. Cek status RLS categories table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'categories';

-- 2. Drop existing policies untuk categories (jika ada)
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;

-- 3. Drop policies yang ada dari setup sebelumnya
DROP POLICY IF EXISTS "Family members can view family categories" ON public.categories;
DROP POLICY IF EXISTS "Family members can create categories" ON public.categories;
DROP POLICY IF EXISTS "Family members can update categories" ON public.categories;
DROP POLICY IF EXISTS "Family members can delete categories" ON public.categories;

-- 4. Buat policy yang benar untuk authenticated users
CREATE POLICY "categories_authenticated_all" ON public.categories
    FOR ALL 
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT created_by FROM public.families WHERE id = family_id
    ))
    WITH CHECK (auth.uid() = created_by OR auth.uid() IN (
        SELECT created_by FROM public.families WHERE id = family_id
    ));

-- 5. Pastikan RLS enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 6. Fix untuk accounts table juga (kemungkinan bermasalah sama)
DROP POLICY IF EXISTS "Family members can view family accounts" ON public.accounts;
DROP POLICY IF EXISTS "Family members can create accounts" ON public.accounts;
DROP POLICY IF EXISTS "Family members can update accounts" ON public.accounts;
DROP POLICY IF EXISTS "Family members can delete accounts" ON public.accounts;

CREATE POLICY "accounts_authenticated_all" ON public.accounts
    FOR ALL 
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT created_by FROM public.families WHERE id = family_id
    ))
    WITH CHECK (auth.uid() = created_by OR auth.uid() IN (
        SELECT created_by FROM public.families WHERE id = family_id
    ));

-- 7. Test insert categories (ini yang trigger lakukan)
-- INSERT INTO public.categories (name, type, family_id, created_by) 
-- VALUES ('Test Category', 'expense', 'some-family-id', auth.uid());