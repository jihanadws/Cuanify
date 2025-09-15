-- Buat SQL function untuk debug auth.uid() dari aplikasi
-- Jalankan ini di SQL Editor dulu

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO anon;

-- Test function
SELECT public.get_current_user_id() as function_result, auth.uid() as direct_result;