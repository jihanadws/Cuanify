import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { transactionService } from '@/services/transaction'
import { offlineStorageService } from '@/services/offline'
import { syncService } from '@/services/sync'
import type { Transaction, Account, Category, DashboardStats, TransactionFilters } from '@/types'

export const useTransactionStore = defineStore('transaction', () => {
  // State
  const transactions = ref<Transaction[]>([])
  const accounts = ref<Account[]>([])
  const categories = ref<Category[]>([])
  const dashboardStats = ref<DashboardStats | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<TransactionFilters>({})
  const isOffline = ref(!navigator.onLine)
  const pendingSyncItems = ref(0)

  // Getters
  const incomeCategories = computed(() => 
    categories.value.filter(cat => cat.type === 'income')
  )
  
  const expenseCategories = computed(() => 
    categories.value.filter(cat => cat.type === 'expense')
  )

  const filteredTransactions = computed(() => {
    let filtered = transactions.value

    if (filters.value.type && filters.value.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.value.type)
    }

    if (filters.value.category_id) {
      filtered = filtered.filter(t => t.category_id === filters.value.category_id)
    }

    if (filters.value.account_id) {
      filtered = filtered.filter(t => t.account_id === filters.value.account_id)
    }

    return filtered
  })

  // Actions
  async function loadDashboardStats(familyId: string) {
    isLoading.value = true
    error.value = null

    try {
      let response
      
      if (navigator.onLine) {
        response = await transactionService.getDashboardStats(familyId)
        
        if (response.error) {
          error.value = response.error
          // Fallback to cached data if online request fails
          return await loadCachedDashboardStats(familyId)
        }

        dashboardStats.value = response.data
        return true
      } else {
        // Load from cache when offline
        return await loadCachedDashboardStats(familyId)
      }
    } catch (err) {
      error.value = 'Terjadi kesalahan saat memuat statistik'
      // Try to load cached data as fallback
      return await loadCachedDashboardStats(familyId)
    } finally {
      isLoading.value = false
    }
  }

  async function loadCachedDashboardStats(familyId: string) {
    try {
      const cachedTransactions = await offlineStorageService.getCachedTransactions(familyId)
      const cachedAccounts = await offlineStorageService.getCachedAccounts(familyId)
      
      // Calculate stats from cached data
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const monthlyTransactions = cachedTransactions.filter(t => {
        const transactionDate = new Date(t.date)
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth
      })
      
      const totalIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalExpense = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalBalance = cachedAccounts.reduce((sum, account) => sum + Number(account.balance), 0)
      const recentTransactions = cachedTransactions.slice(0, 5)

      dashboardStats.value = {
        totalIncome,
        totalExpense,
        totalBalance,
        recentTransactions
      }
      
      return true
    } catch (err) {
      console.error('Error loading cached dashboard stats:', err)
      return false
    }
  }

  async function loadTransactions(familyId: string, transactionFilters?: TransactionFilters) {
    isLoading.value = true
    error.value = null

    try {
      if (navigator.onLine) {
        const response = await transactionService.getTransactions(familyId, transactionFilters)
        
        if (response.error) {
          error.value = response.error
          // Fallback to cached data
          transactions.value = await offlineStorageService.getCachedTransactions(familyId)
          return false
        }

        transactions.value = response.data || []
        
        // Cache for offline access
        await offlineStorageService.cacheTransactions(familyId, transactions.value)
        
        return true
      } else {
        // Load from cache when offline
        transactions.value = await offlineStorageService.getCachedTransactions(familyId)
        return true
      }
    } catch (err) {
      error.value = 'Terjadi kesalahan saat memuat transaksi'
      // Try to load cached data as fallback
      transactions.value = await offlineStorageService.getCachedTransactions(familyId)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function loadAccounts(familyId: string) {
    isLoading.value = true
    error.value = null

    try {
      if (navigator.onLine) {
        const response = await transactionService.getAccounts(familyId)
        
        if (response.error) {
          error.value = response.error
          accounts.value = await offlineStorageService.getCachedAccounts(familyId)
          return false
        }

        accounts.value = response.data || []
        await offlineStorageService.cacheAccounts(familyId, accounts.value)
        return true
      } else {
        accounts.value = await offlineStorageService.getCachedAccounts(familyId)
        return true
      }
    } catch (err) {
      error.value = 'Terjadi kesalahan saat memuat akun'
      accounts.value = await offlineStorageService.getCachedAccounts(familyId)
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function loadCategories(familyId: string, type?: 'income' | 'expense') {
    isLoading.value = true
    error.value = null

    try {
      if (navigator.onLine) {
        const response = await transactionService.getCategories(familyId, type)
        
        console.log('Categories API response:', {
          familyId,
          type,
          responseError: response.error,
          dataLength: response.data?.length || 0,
          allCategoriesDetailed: response.data?.map(cat => ({
            id: cat.id,
            name: cat.name,
            type: cat.type,
            family_id: cat.family_id,
            created_by: cat.created_by
          }))
        })
        
        if (response.error) {
          error.value = response.error
          const cached = await offlineStorageService.getCachedCategories(familyId)
          categories.value = type ? cached.filter(cat => cat.type === type) : cached
          return false
        }

        if (type) {
          categories.value = categories.value.filter(cat => cat.type !== type)
          categories.value.push(...(response.data || []))
        } else {
          categories.value = response.data || []
        }
        
        console.log('Categories loaded successfully:', {
          totalCategories: categories.value.length,
          incomeCount: categories.value.filter(cat => cat.type === 'income').length,
          expenseCount: categories.value.filter(cat => cat.type === 'expense').length
        })
        
        await offlineStorageService.cacheCategories(familyId, categories.value)
        return true
      } else {
        const cached = await offlineStorageService.getCachedCategories(familyId)
        categories.value = type ? cached.filter(cat => cat.type === type) : cached
        return true
      }
    } catch (err) {
      error.value = 'Terjadi kesalahan saat memuat kategori'
      const cached = await offlineStorageService.getCachedCategories(familyId)
      categories.value = type ? cached.filter(cat => cat.type === type) : cached
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function createTransaction(familyId: string, userId: string, transactionData: any) {
    isLoading.value = true
    error.value = null

    try {
      if (navigator.onLine) {
        const response = await transactionService.createTransaction(familyId, userId, transactionData)
        
        if (response.error) {
          error.value = response.error
          return false
        }

        // Add to local state
        if (response.data) {
          transactions.value.unshift(response.data)
        }

        // Reload dashboard stats
        await loadDashboardStats(familyId)
        
        return true
      } else {
        // Create offline transaction
        const offlineId = await offlineStorageService.createOfflineTransaction(familyId, userId, transactionData)
        
        // Add to local state immediately
        const offlineTransaction = {
          id: offlineId,
          family_id: familyId,
          account_id: transactionData.account_id,
          category_id: transactionData.category_id,
          type: transactionData.type,
          amount: transactionData.amount,
          description: transactionData.description || '',
          date: transactionData.date || new Date().toISOString().split('T')[0],
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Add offline indicator
          _offline: true
        }
        
        transactions.value.unshift(offlineTransaction as any)
        
        // Update pending sync counter
        const status = await syncService.getSyncStatus()
        pendingSyncItems.value = status.pendingItems
        
        return true
      }
    } catch (err) {
      error.value = 'Terjadi kesalahan saat membuat transaksi'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function updateTransaction(transactionId: string, updates: Partial<Transaction>) {
    isLoading.value = true
    error.value = null

    try {
      const response = await transactionService.updateTransaction(transactionId, updates)
      
      if (response.error) {
        error.value = response.error
        return false
      }

      // Update local state
      const index = transactions.value.findIndex(t => t.id === transactionId)
      if (index !== -1 && response.data) {
        transactions.value[index] = response.data
      }
      
      return true
    } catch (err) {
      error.value = 'Terjadi kesalahan saat mengupdate transaksi'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function deleteTransaction(transactionId: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await transactionService.deleteTransaction(transactionId)
      
      if (response.error) {
        error.value = response.error
        return false
      }

      // Remove from local state
      transactions.value = transactions.value.filter(t => t.id !== transactionId)
      
      return true
    } catch (err) {
      error.value = 'Terjadi kesalahan saat menghapus transaksi'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function setFilters(newFilters: TransactionFilters) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {}
  }

  function clearError() {
    error.value = null
  }

  // Offline/sync management
  async function initializeOfflineSync() {
    // Initialize sync service
    await syncService.initialize()
    
    // Setup network status monitoring
    const updateNetworkStatus = () => {
      isOffline.value = !navigator.onLine
    }
    
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    
    // Update sync status periodically
    setInterval(async () => {
      const status = await syncService.getSyncStatus()
      pendingSyncItems.value = status.pendingItems
    }, 10000)
  }

  async function forceSyncNow() {
    if (!navigator.onLine) {
      error.value = 'Tidak dapat sinkronisasi saat offline'
      return false
    }
    
    const result = await syncService.forceSyncNow()
    
    if (!result.success) {
      error.value = `Sinkronisasi gagal: ${result.errors.join(', ')}`
      return false
    }
    
    // Update sync status
    const status = await syncService.getSyncStatus()
    pendingSyncItems.value = status.pendingItems
    
    return true
  }

  async function downloadAndCacheData(familyId: string) {
    if (navigator.onLine) {
      try {
        await syncService.downloadAndCache(familyId)
      } catch (error) {
        console.error('Failed to download and cache data:', error)
      }
    }
  }

  // Utility functions
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  function getCategoryById(categoryId: string): Category | undefined {
    return categories.value.find(cat => cat.id === categoryId)
  }

  function getAccountById(accountId: string): Account | undefined {
    return accounts.value.find(acc => acc.id === accountId)
  }

  return {
    // State
    transactions,
    accounts,
    categories,
    dashboardStats,
    isLoading,
    error,
    filters,
    isOffline,
    pendingSyncItems,
    
    // Getters
    incomeCategories,
    expenseCategories,
    filteredTransactions,
    
    // Actions
    loadDashboardStats,
    loadTransactions,
    loadAccounts,
    loadCategories,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    setFilters,
    clearFilters,
    clearError,
    
    // Offline/sync actions
    initializeOfflineSync,
    forceSyncNow,
    downloadAndCacheData,
    
    // Utilities
    formatCurrency,
    getCategoryById,
    getAccountById
  }
})