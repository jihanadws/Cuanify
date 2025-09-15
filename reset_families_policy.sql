-- Reset semua policy untuk tabel families
-- Jalankan di Supabase SQL Editor

-- 1. Hapus semua policy yang ada
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'families' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.families';
    END LOOP;
END $$;

-- 2. Hapus policy family_members juga
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'family_members' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.family_members';
    END LOOP;
END $$;

-- 3. Pastikan RLS aktif
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 4. Buat policy baru yang sederhana
CREATE POLICY "families_insert_policy" ON public.families
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid()::text = created_by::text
);

CREATE POLICY "families_select_policy" ON public.families
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.family_id = families.id 
      AND fm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "family_members_insert_policy" ON public.family_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "family_members_select_policy" ON public.family_members
FOR SELECT
USING (auth.uid() = user_id);

-- 5. Test query
-- SELECT auth.uid() as current_user_id;
-- SELECT * FROM public.users WHERE id = auth.uid();