-- Fix RLS policy untuk tabel families
-- Jalankan di Supabase SQL Editor

-- 1. Drop semua policy lama
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.families;
DROP POLICY IF EXISTS "Users can create families" ON public.families;

-- 2. Pastikan RLS aktif
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- 3. Buat policy sederhana untuk INSERT
CREATE POLICY "Allow authenticated users to create families" ON public.families
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- 4. Policy untuk SELECT
DROP POLICY IF EXISTS "Users can view families they belong to" ON public.families;
CREATE POLICY "Allow users to view their families" ON public.families
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = families.id 
    AND fm.user_id = auth.uid()
  )
);

-- 5. Policy untuk UPDATE
DROP POLICY IF EXISTS "Family owners can update" ON public.families;
CREATE POLICY "Allow family owners to update" ON public.families
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = families.id 
    AND fm.user_id = auth.uid() 
    AND fm.role = 'owner'
  )
);

-- 6. Policy untuk DELETE
DROP POLICY IF EXISTS "Family owners can delete" ON public.families;
CREATE POLICY "Allow family owners to delete" ON public.families
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = families.id 
    AND fm.user_id = auth.uid() 
    AND fm.role = 'owner'
  )
);

-- 7. Pastikan policy untuk family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can add themselves as owners to families they created" ON public.family_members;
DROP POLICY IF EXISTS "Users can add themselves as family owners" ON public.family_members;

CREATE POLICY "Allow users to add themselves to families" ON public.family_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 8. Test query untuk debugging
-- Uncomment untuk test manual di SQL Editor:
-- SELECT auth.uid() as current_user_id;
-- SELECT * FROM public.users WHERE id = auth.uid();
-- SELECT auth.uid() = '34fc1ce7-827a-4883-a2b7-958ff6ca5387' as id_match;

-- 9. Test insert dengan ID manual (ganti dengan ID user Anda):
-- INSERT INTO public.families (name, created_by)
-- VALUES ('Test Family', '34fc1ce7-827a-4883-a2b7-958ff6ca5387');

-- 10. Untuk test di aplikasi, tambahkan policy yang lebih permisif sementara:
DROP POLICY IF EXISTS "Allow authenticated users to create families" ON public.families;

-- Policy sementara yang lebih permisif untuk debugging
CREATE POLICY "Allow authenticated users to create families v2" ON public.families
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  auth.uid()::text = created_by::text
);

-- 11. Pastikan ada policy untuk SELECT yang lebih umum juga
DROP POLICY IF EXISTS "Allow users to view their families" ON public.families;
CREATE POLICY "Allow users to view their families v2" ON public.families
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