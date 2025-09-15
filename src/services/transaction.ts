import { supabase } from './supabase'
import type { Transaction, Account, Category, DashboardStats, TransactionFilters, ApiResponse } from '@/types'

export class TransactionService {
  // Get dashboard statistics
  async getDashboardStats(familyId: string): Promise<ApiResponse<DashboardStats>> {
    try {
      // Get current month date range
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      // Get transactions for current month
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          account:accounts(name, type),
          category:categories(name, type, icon, color),
          user:users(full_name)
        `)
        .eq('family_id', familyId)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('created_at', { ascending: false })

      if (transactionError) {
        return {
          data: null,
          error: transactionError.message,
          status: 400
        }
      }

      // Calculate totals
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      // Get total balance from all accounts
      const { data: accounts, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('family_id', familyId)

      if (accountError) {
        return {
          data: null,
          error: accountError.message,
          status: 400
        }
      }

      const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0)

      // Get recent transactions (last 5)
      const recentTransactions = transactions.slice(0, 5)

      return {
        data: {
          totalIncome,
          totalExpense,
          totalBalance,
          recentTransactions
        },
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengambil statistik',
        status: 500
      }
    }
  }

  // Get transactions with filters
  async getTransactions(familyId: string, filters?: TransactionFilters): Promise<ApiResponse<Transaction[]>> {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          account:accounts(name, type),
          category:categories(name, type, icon, color),
          user:users(full_name)
        `)
        .eq('family_id', familyId)

      // Apply filters
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }
      
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      
      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id)
      }
      
      if (filters?.date_from) {
        query = query.gte('date', filters.date_from)
      }
      
      if (filters?.date_to) {
        query = query.lte('date', filters.date_to)
      }
      
      if (filters?.member_id) {
        query = query.eq('created_by', filters.member_id)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data: data || [],
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error getting transactions:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengambil transaksi',
        status: 500
      }
    }
  }

  // Create transaction
  async createTransaction(familyId: string, userId: string, transactionData: Omit<Transaction, 'id' | 'family_id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Transaction>> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          family_id: familyId,
          created_by: userId
        })
        .select(`
          *,
          account:accounts(name, type),
          category:categories(name, type, icon, color),
          user:users(full_name)
        `)
        .single()

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      // Update account balance
      await this.updateAccountBalance(transactionData.account_id, transactionData.type, Number(transactionData.amount))

      return {
        data,
        error: null,
        status: 201
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat membuat transaksi',
        status: 500
      }
    }
  }

  // Update transaction
  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<ApiResponse<Transaction>> {
    try {
      // Get original transaction for balance calculation
      const { data: originalTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', transactionId)
        .select(`
          *,
          account:accounts(name, type),
          category:categories(name, type, icon, color),
          user:users(full_name)
        `)
        .single()

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      // Update account balance if amount or type changed
      if (originalTransaction && (updates.amount || updates.type)) {
        // Reverse original transaction
        await this.updateAccountBalance(
          originalTransaction.account_id,
          originalTransaction.type === 'income' ? 'expense' : 'income',
          Number(originalTransaction.amount)
        )
        
        // Apply new transaction
        await this.updateAccountBalance(
          data.account_id,
          data.type,
          Number(data.amount)
        )
      }

      return {
        data,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengupdate transaksi',
        status: 500
      }
    }
  }

  // Delete transaction
  async deleteTransaction(transactionId: string): Promise<ApiResponse<null>> {
    try {
      // Get transaction for balance calculation
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      // Update account balance (reverse the transaction)
      if (transaction) {
        await this.updateAccountBalance(
          transaction.account_id,
          transaction.type === 'income' ? 'expense' : 'income',
          Number(transaction.amount)
        )
      }

      return {
        data: null,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat menghapus transaksi',
        status: 500
      }
    }
  }

  // Update account balance
  private async updateAccountBalance(accountId: string, type: 'income' | 'expense', amount: number): Promise<void> {
    try {
      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', accountId)
        .single()

      if (account) {
        const currentBalance = Number(account.balance)
        const newBalance = type === 'income' 
          ? currentBalance + amount 
          : currentBalance - amount

        await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', accountId)
      }
    } catch (error) {
      console.error('Error updating account balance:', error)
    }
  }

  // Get accounts
  async getAccounts(familyId: string): Promise<ApiResponse<Account[]>> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('family_id', familyId)
        .order('name')

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data: data || [],
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error getting accounts:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengambil akun',
        status: 500
      }
    }
  }

  // Get categories
  async getCategories(familyId: string, type?: 'income' | 'expense'): Promise<ApiResponse<Category[]>> {
    try {
      let query = supabase
        .from('categories')
        .select('*')
        .eq('family_id', familyId)

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query.order('name')

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data: data || [],
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error getting categories:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengambil kategori',
        status: 500
      }
    }
  }
}

export const transactionService = new TransactionService()