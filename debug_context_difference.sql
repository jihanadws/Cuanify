-- Debug RLS Context - Cek perbedaan auth.uid() di berbagai context
-- Jalankan ini di SQL Editor untuk dibandingkan dengan aplikasi

-- 1. Cek auth.uid() di SQL Editor context
SELECT 
  'SQL Editor Context' as context,
  auth.uid() as current_user_id,
  auth.jwt() as jwt_info;

-- 2. Cek current settings
SHOW row_security;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'family_members');

-- 3. Cek policies yang aktif
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'family_members');

-- 4. Test dengan berbagai cara
-- A. Test dengan explicit user ID (seperti yang berhasil sebelumnya)
INSERT INTO public.families (name, created_by)
VALUES ('Test SQL Context', '34fc1ce7-827a-4883-a2b7-958ff6ca5387');

-- B. Test dengan auth.uid() - ini yang mungkin berbeda di SQL Editor vs App
-- INSERT INTO public.families (name, created_by)
-- VALUES ('Test Auth UID', auth.uid());

-- 5. Cleanup
DELETE FROM public.families WHERE name LIKE 'Test%';

-- 6. Check apakah ada konflik dengan service role vs authenticated role
SELECT current_user, session_user;