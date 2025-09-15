-- Family Finance PWA Database Schema
-- Run this entire script in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  family_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members table (junction table)
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, family_id)
);

-- Accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('cash', 'bank', 'credit', 'investment')) NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  icon TEXT DEFAULT 'dollar-sign',
  color TEXT DEFAULT '#6B7280',
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) NOT NULL,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  period TEXT CHECK (period IN ('monthly', 'yearly')) NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15,2) DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate family code
CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate family code
CREATE OR REPLACE FUNCTION set_family_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_code IS NULL OR NEW.family_code = '' THEN
    NEW.family_code := generate_family_code();
    WHILE EXISTS (SELECT 1 FROM families WHERE family_code = NEW.family_code) LOOP
      NEW.family_code := generate_family_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_family_code
  BEFORE INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION set_family_code();

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Family members policies
CREATE POLICY "Family members can view own memberships" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add themselves as owners to families they created" ON public.family_members FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.families f 
    WHERE f.id = family_members.family_id 
    AND f.created_by = auth.uid()
  )
);
CREATE POLICY "Family owners can manage other memberships" ON public.family_members FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = family_members.family_id 
    AND fm.user_id = auth.uid() 
    AND fm.role = 'owner'
  )
);
CREATE POLICY "Family owners can delete memberships" ON public.family_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = family_members.family_id 
    AND fm.user_id = auth.uid() 
    AND fm.role = 'owner'
  )
);

-- Families policies
CREATE POLICY "Family members can view their family" ON public.families FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = families.id 
    AND fm.user_id = auth.uid()
  )
);
CREATE POLICY "Family owners can update their family" ON public.families FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm 
    WHERE fm.family_id = families.id 
    AND fm.user_id = auth.uid() 
    AND fm.role = 'owner'
  )
);
CREATE POLICY "Authenticated users can create families" ON public.families FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Helper function for family access
CREATE OR REPLACE FUNCTION user_has_family_access(family_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = family_id_param
    AND fm.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accounts policies
CREATE POLICY "Family members can view family accounts" ON public.accounts FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create accounts" ON public.accounts FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update accounts" ON public.accounts FOR UPDATE USING (user_has_family_access(family_id));
CREATE POLICY "Family members can delete accounts" ON public.accounts FOR DELETE USING (user_has_family_access(family_id));

-- Categories policies
CREATE POLICY "Family members can view family categories" ON public.categories FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create categories" ON public.categories FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update categories" ON public.categories FOR UPDATE USING (user_has_family_access(family_id));
CREATE POLICY "Family members can delete categories" ON public.categories FOR DELETE USING (user_has_family_access(family_id));

-- Transactions policies
CREATE POLICY "Family members can view family transactions" ON public.transactions FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create transactions" ON public.transactions FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update own transactions" ON public.transactions FOR UPDATE USING (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can delete own transactions" ON public.transactions FOR DELETE USING (user_has_family_access(family_id) AND auth.uid() = created_by);

-- Budgets policies
CREATE POLICY "Family members can view family budgets" ON public.budgets FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create budgets" ON public.budgets FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update budgets" ON public.budgets FOR UPDATE USING (user_has_family_access(family_id));
CREATE POLICY "Family members can delete budgets" ON public.budgets FOR DELETE USING (user_has_family_access(family_id));

-- Goals policies
CREATE POLICY "Family members can view family goals" ON public.goals FOR SELECT USING (user_has_family_access(family_id));
CREATE POLICY "Family members can create goals" ON public.goals FOR INSERT WITH CHECK (user_has_family_access(family_id) AND auth.uid() = created_by);
CREATE POLICY "Family members can update goals" ON public.goals FOR UPDATE USING (user_has_family_access(family_id));
CREATE POLICY "Family members can delete goals" ON public.goals FOR DELETE USING (user_has_family_access(family_id));

-- Insert default categories function
CREATE OR REPLACE FUNCTION create_default_categories(family_id_param UUID, user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Income categories
  INSERT INTO public.categories (family_id, name, type, icon, color, created_by) VALUES
  (family_id_param, 'Gaji', 'income', 'briefcase', '#10B981', user_id_param),
  (family_id_param, 'Bonus', 'income', 'gift', '#059669', user_id_param),
  (family_id_param, 'Investasi', 'income', 'trending-up', '#047857', user_id_param),
  (family_id_param, 'Lain-lain', 'income', 'plus-circle', '#065F46', user_id_param);
  
  -- Expense categories
  INSERT INTO public.categories (family_id, name, type, icon, color, created_by) VALUES
  (family_id_param, 'Makanan', 'expense', 'coffee', '#EF4444', user_id_param),
  (family_id_param, 'Transportasi', 'expense', 'car', '#DC2626', user_id_param),
  (family_id_param, 'Belanja', 'expense', 'shopping-bag', '#B91C1C', user_id_param),
  (family_id_param, 'Tagihan', 'expense', 'file-text', '#991B1B', user_id_param),
  (family_id_param, 'Kesehatan', 'expense', 'heart', '#7F1D1D', user_id_param),
  (family_id_param, 'Hiburan', 'expense', 'smile', '#F59E0B', user_id_param),
  (family_id_param, 'Lain-lain', 'expense', 'minus-circle', '#78716C', user_id_param);
END;
$$ LANGUAGE plpgsql;

-- Insert default accounts function
CREATE OR REPLACE FUNCTION create_default_accounts(family_id_param UUID, user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Default accounts
  INSERT INTO public.accounts (family_id, name, type, balance, created_by) VALUES
  (family_id_param, 'Kas', 'cash', 0, user_id_param),
  (family_id_param, 'Bank', 'bank', 0, user_id_param);
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default data when family is created
CREATE OR REPLACE FUNCTION setup_new_family()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default categories
  PERFORM create_default_categories(NEW.id, NEW.created_by);
  
  -- Create default accounts
  PERFORM create_default_accounts(NEW.id, NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_setup_new_family
  AFTER INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION setup_new_family();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_transactions_family_id ON public.transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_created_by ON public.transactions(created_by);
CREATE INDEX IF NOT EXISTS idx_accounts_family_id ON public.accounts(family_id);
CREATE INDEX IF NOT EXISTS idx_categories_family_id ON public.categories(family_id);

-- Insert trigger for auth.users to create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();