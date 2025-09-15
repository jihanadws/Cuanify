-- Temporary disable RLS untuk testing
-- HANYA UNTUK TESTING - JANGAN LUPA ENABLE KEMBALI

-- 1. Disable RLS sementara
ALTER TABLE public.families DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;

-- 2. Test insert manual di SQL Editor
INSERT INTO public.families (name, created_by)
VALUES ('Test Family No RLS', '34fc1ce7-827a-4883-a2b7-958ff6ca5387');

-- 3. Cek apakah berhasil
SELECT * FROM public.families WHERE created_by = '34fc1ce7-827a-4883-a2b7-958ff6ca5387';

-- 4. Hapus test data
DELETE FROM public.families WHERE name = 'Test Family No RLS';

-- 5. Enable RLS kembali
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;