import { supabase } from './supabase'
import type { Account, Category, ApiResponse, AccountForm, CategoryForm } from '@/types'

export class AccountCategoryService {
  // Account Management
  async createAccount(familyId: string, userId: string, accountData: AccountForm): Promise<ApiResponse<Account>> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          ...accountData,
          family_id: familyId,
          created_by: userId
        })
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data,
        error: null,
        status: 201
      }
    } catch (error) {
      console.error('Error creating account:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat membuat akun',
        status: 500
      }
    }
  }

  async updateAccount(accountId: string, updates: Partial<AccountForm>): Promise<ApiResponse<Account>> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', accountId)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error updating account:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengupdate akun',
        status: 500
      }
    }
  }

  async deleteAccount(accountId: string): Promise<ApiResponse<null>> {
    try {
      // Check if account has transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('account_id', accountId)
        .limit(1)

      if (transactions && transactions.length > 0) {
        return {
          data: null,
          error: 'Tidak dapat menghapus akun yang memiliki transaksi',
          status: 400
        }
      }

      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId)

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data: null,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat menghapus akun',
        status: 500
      }
    }
  }

  // Category Management
  async createCategory(familyId: string, userId: string, categoryData: CategoryForm): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...categoryData,
          family_id: familyId,
          created_by: userId
        })
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data,
        error: null,
        status: 201
      }
    } catch (error) {
      console.error('Error creating category:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat membuat kategori',
        status: 500
      }
    }
  }

  async updateCategory(categoryId: string, updates: Partial<CategoryForm>): Promise<ApiResponse<Category>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error updating category:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengupdate kategori',
        status: 500
      }
    }
  }

  async deleteCategory(categoryId: string): Promise<ApiResponse<null>> {
    try {
      // Check if category has transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('category_id', categoryId)
        .limit(1)

      if (transactions && transactions.length > 0) {
        return {
          data: null,
          error: 'Tidak dapat menghapus kategori yang memiliki transaksi',
          status: 400
        }
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data: null,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat menghapus kategori',
        status: 500
      }
    }
  }

  // Get account statistics
  async getAccountStats(familyId: string): Promise<ApiResponse<any>> {
    try {
      const { data: accounts, error: accountError } = await supabase
        .from('accounts')
        .select(`
          *,
          transactions(amount, type)
        `)
        .eq('family_id', familyId)

      if (accountError) {
        return {
          data: null,
          error: accountError.message,
          status: 400
        }
      }

      const accountStats = accounts?.map(account => {
        const transactions = account.transactions || []
        const totalIncome = transactions
          .filter((t: any) => t.type === 'income')
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
        
        const totalExpense = transactions
          .filter((t: any) => t.type === 'expense')
          .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

        return {
          ...account,
          total_income: totalIncome,
          total_expense: totalExpense,
          transaction_count: transactions.length
        }
      })

      return {
        data: accountStats || [],
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error getting account stats:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengambil statistik akun',
        status: 500
      }
    }
  }

  // Get category statistics
  async getCategoryStats(familyId: string): Promise<ApiResponse<any>> {
    try {
      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select(`
          *,
          transactions(amount, type)
        `)
        .eq('family_id', familyId)

      if (categoryError) {
        return {
          data: null,
          error: categoryError.message,
          status: 400
        }
      }

      const categoryStats = categories?.map(category => {
        const transactions = category.transactions || []
        const totalAmount = transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0)

        return {
          ...category,
          total_amount: totalAmount,
          transaction_count: transactions.length
        }
      })

      return {
        data: categoryStats || [],
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error getting category stats:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengambil statistik kategori',
        status: 500
      }
    }
  }
}

export const accountCategoryService = new AccountCategoryService()