# Supabase Setup Guide for Family Finance PWA

## Step 1: Create Supabase Project

### 1.1 Sign Up/Login to Supabase
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub or email
4. Login to your dashboard

### 1.2 Create New Project
1. Click "New Project"
2. Choose your organization
3. Fill project details:
   - **Name**: `family-finance-pwa`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
4. Click "Create new project"
5. Wait for project to be ready (2-3 minutes)

### 1.3 Get Project Credentials
Once project is ready:
1. Go to Settings → API
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Public Key**: `eyJhbG...` (long string starting with eyJ)

## Step 2: Configure Database Schema

### 2.1 Access SQL Editor
1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New Query"

### 2.2 Run Database Schema
Copy and paste the entire SQL schema from the file below and execute it:

```sql
-- The complete schema is provided in the next section
```

### 2.3 Verify Tables Created
After running the schema:
1. Go to "Table Editor"
2. You should see these tables:
   - users
   - families  
   - family_members
   - accounts
   - categories
   - transactions
   - budgets
   - goals

## Step 3: Configure Row Level Security

The SQL schema already includes RLS policies, but verify:
1. Go to "Authentication" → "Policies"
2. Check that policies exist for all tables
3. Ensure "Enable RLS" is turned on for all tables

## Step 4: Test Authentication

1. Go to "Authentication" → "Settings"
2. Ensure "Enable email confirmations" is OFF for development
3. You can enable it later for production

## Step 5: Environment Variables

Copy your Project URL and Anon Key to create `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Troubleshooting

### Common Issues:
1. **RLS Error**: Make sure all tables have RLS enabled
2. **Policy Error**: Check that policies are created correctly
3. **Connection Error**: Verify URL and key are correct
4. **Schema Error**: Run schema in correct order (create extensions first)

### Testing Connection:
You can test if setup is working by:
1. Starting the app (`npm run dev`)
2. Trying to register a new user
3. Check if user appears in Supabase Auth → Users

## Next Steps

After Supabase is set up:
1. Configure environment variables in your app
2. Test user registration/login
3. Create a family and test family code system
4. Start adding transactions

## Security Notes

- Never commit your database password or service role key
- Use environment variables for all credentials
- Enable RLS on all tables in production
- Regular backup your database

## Production Considerations

For production deployment:
1. Enable email confirmations
2. Configure custom SMTP (optional)
3. Set up database backups
4. Configure custom domain
5. Enable additional security features