// Environment Variables
export interface SupabaseConfig {
  url: string
  anonKey: string
}

// Database Types
export interface User {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
}

export interface Family {
  id: string
  name: string
  family_code: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  user_id: string
  family_id: string
  role: 'owner' | 'member'
  joined_at: string
  user?: User
  family?: Family
}

export interface Account {
  id: string
  family_id: string
  name: string
  type: 'cash' | 'bank' | 'credit' | 'investment'
  balance: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  family_id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  family_id: string
  account_id: string
  category_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  created_by: string
  created_at: string
  updated_at: string
  account?: Account
  category?: Category
  user?: User
}

export interface Budget {
  id: string
  family_id: string
  category_id: string
  amount: number
  period: 'monthly' | 'yearly'
  start_date: string
  end_date: string
  created_by: string
  created_at: string
  updated_at: string
  category?: Category
}

export interface Goal {
  id: string
  family_id: string
  name: string
  description: string
  target_amount: number
  current_amount: number
  target_date: string
  status: 'active' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

// Authentication Types
export interface AuthUser {
  id: string
  email: string
  full_name: string
  family_id?: string
  role?: 'owner' | 'member'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  full_name: string
}

// Store Types
export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface FamilyState {
  currentFamily: Family | null
  members: FamilyMember[]
  isLoading: boolean
}

export interface TransactionState {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  isLoading: boolean
  filters: TransactionFilters
}

export interface TransactionFilters {
  type?: 'income' | 'expense' | 'all'
  category_id?: string
  account_id?: string
  date_from?: string
  date_to?: string
  member_id?: string
}

// Form Types
export interface TransactionForm {
  type: 'income' | 'expense'
  amount: number
  description: string
  category_id: string
  account_id: string
  date: string
}

export interface AccountForm {
  name: string
  type: 'cash' | 'bank' | 'credit' | 'investment'
  balance: number
}

export interface CategoryForm {
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
}

// Utility Types
export interface DashboardStats {
  totalIncome: number
  totalExpense: number
  totalBalance: number
  recentTransactions: Transaction[]
}

export interface MonthlyData {
  month: string
  income: number
  expense: number
  balance: number
}

// Offline Storage Types
export interface OfflineTransaction {
  id: string
  data: Partial<Transaction>
  action: 'create' | 'update' | 'delete'
  timestamp: number
  synced: boolean
}