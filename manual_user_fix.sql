-- Manual fix for user profile issues
-- Replace 'YOUR_USER_ID_HERE' with actual user ID from your app

-- Step 1: First, let's see all auth users
SELECT 'All Auth Users' as info, id, email, created_at, 
       raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Step 2: Find the specific user ID you're using in the app
-- Look at the browser network tab when trying to create family
-- or check localStorage for 'sb-[project-id]-auth-token'

-- Step 3: Manually create user profile (replace YOUR_USER_ID_HERE)
-- UNCOMMENT AND MODIFY THE LINES BELOW:

/*
INSERT INTO public.users (id, email, full_name)
SELECT 
  'YOUR_USER_ID_HERE',  -- Replace with your actual user ID
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'User') as full_name
FROM auth.users 
WHERE id = 'YOUR_USER_ID_HERE'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();
*/

-- Step 4: Verify the user profile was created
-- SELECT * FROM public.users WHERE id = 'YOUR_USER_ID_HERE';