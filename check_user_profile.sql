-- Pastikan user profile ada untuk testing
-- Jalankan ini di SQL Editor

-- 1. Cek apakah user profile ada
SELECT * FROM auth.users WHERE id = '34fc1ce7-827a-4883-a2b7-958ff6ca5387';

-- 2. Cek apakah ada di public.users table
SELECT * FROM public.users WHERE id = '34fc1ce7-827a-4883-a2b7-958ff6ca5387';

-- 3. Jika tidak ada di public.users, insert manual (sesuaikan dengan data yang benar)
INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    created_at, 
    updated_at
) VALUES (
    '34fc1ce7-827a-4883-a2b7-958ff6ca5387',
    'user@example.com', -- Ganti dengan email yang benar
    'Test User', -- Ganti dengan nama yang benar
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 4. Verify user profile
SELECT 
    u.id,
    u.email,
    u.full_name,
    au.email as auth_email,
    au.email_confirmed_at
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.id = '34fc1ce7-827a-4883-a2b7-958ff6ca5387';