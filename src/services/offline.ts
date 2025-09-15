import Dexie, { type Table } from 'dexie'
import type { Transaction, Account, Category } from '@/types'

// Offline transaction interface
interface OfflineTransaction {
  id?: string
  timestamp: number
  synced: boolean
}

// Database interface
interface OfflineDB {
  transactions: Table<Transaction>
  accounts: Table<Account>
  categories: Table<Category>
  offlineTransactions: Table<OfflineTransaction>
  syncQueue: Table<{
    id?: number
    type: 'transaction' | 'account' | 'category'
    action: 'create' | 'update' | 'delete'
    data: any
    originalId?: string
    timestamp: number
    synced: boolean
  }>
}

// Create database instance
class OfflineDatabase extends Dexie implements OfflineDB {
  transactions!: Table<Transaction>
  accounts!: Table<Account>
  categories!: Table<Category>
  offlineTransactions!: Table<OfflineTransaction>
  syncQueue!: Table<{
    id?: number
    type: 'transaction' | 'account' | 'category'
    action: 'create' | 'update' | 'delete'
    data: any
    originalId?: string
    timestamp: number
    synced: boolean
  }>

  constructor() {
    super('FamilyFinanceDB')
    
    this.version(1).stores({
      transactions: 'id, family_id, account_id, category_id, type, date, created_by, created_at',
      accounts: 'id, family_id, name, type, created_by',
      categories: 'id, family_id, name, type, created_by',
      offlineTransactions: 'id, timestamp, synced',
      syncQueue: '++id, type, action, timestamp, synced'
    })
  }
}

export const offlineDB = new OfflineDatabase()

export class OfflineStorageService {
  private db = offlineDB

  // Initialize offline storage
  async initialize(): Promise<void> {
    try {
      await this.db.open()
      console.log('Offline database initialized successfully')
    } catch (error) {
      console.error('Failed to initialize offline database:', error)
      throw error
    }
  }

  // Cache data for offline access
  async cacheTransactions(familyId: string, transactions: Transaction[]): Promise<void> {
    try {
      // Clear existing transactions for this family
      await this.db.transactions.where('family_id').equals(familyId).delete()
      
      // Serialize transactions to prevent DataCloneError
      const serializedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        family_id: transaction.family_id,
        account_id: transaction.account_id,
        category_id: transaction.category_id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        created_by: transaction.created_by,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      }))
      
      // Add new transactions
      await this.db.transactions.bulkAdd(serializedTransactions)
      console.log(`Cached ${serializedTransactions.length} transactions for offline access`)
    } catch (error) {
      console.error('Error caching transactions:', error)
    }
  }

  async cacheAccounts(familyId: string, accounts: Account[]): Promise<void> {
    try {
      await this.db.accounts.where('family_id').equals(familyId).delete()
      
      // Serialize accounts to prevent DataCloneError
      const serializedAccounts = accounts.map(account => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        family_id: account.family_id,
        created_by: account.created_by,
        created_at: account.created_at,
        updated_at: account.updated_at
      }))
      
      await this.db.accounts.bulkAdd(serializedAccounts)
      console.log(`Cached ${serializedAccounts.length} accounts for offline access`)
    } catch (error) {
      console.error('Error caching accounts:', error)
    }
  }

  async cacheCategories(familyId: string, categories: Category[]): Promise<void> {
    try {
      await this.db.categories.where('family_id').equals(familyId).delete()
      
      // Serialize categories to prevent DataCloneError
      const serializedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
        family_id: category.family_id,
        created_by: category.created_by,
        created_at: category.created_at,
        updated_at: category.updated_at
      }))
      
      await this.db.categories.bulkAdd(serializedCategories)
      console.log(`Cached ${serializedCategories.length} categories for offline access`)
    } catch (error) {
      console.error('Error caching categories:', error)
    }
  }

  // Get cached data
  async getCachedTransactions(familyId: string): Promise<Transaction[]> {
    try {
      return await this.db.transactions.where('family_id').equals(familyId).toArray()
    } catch (error) {
      console.error('Error getting cached transactions:', error)
      return []
    }
  }

  async getCachedAccounts(familyId: string): Promise<Account[]> {
    try {
      return await this.db.accounts.where('family_id').equals(familyId).toArray()
    } catch (error) {
      console.error('Error getting cached accounts:', error)
      return []
    }
  }

  async getCachedCategories(familyId: string): Promise<Category[]> {
    try {
      return await this.db.categories.where('family_id').equals(familyId).toArray()
    } catch (error) {
      console.error('Error getting cached categories:', error)
      return []
    }
  }

  // Offline transaction management
  async createOfflineTransaction(
    familyId: string,
    userId: string,
    transactionData: Partial<Transaction>
  ): Promise<string> {
    try {
      const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      
      const transaction: Transaction = {
        id: offlineId,
        family_id: familyId,
        account_id: transactionData.account_id!,
        category_id: transactionData.category_id!,
        type: transactionData.type!,
        amount: transactionData.amount!,
        description: transactionData.description || '',
        date: transactionData.date || new Date().toISOString().split('T')[0],
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Serialize transaction before adding to prevent DataCloneError
      const serializedTransaction = {
        id: transaction.id,
        family_id: transaction.family_id,
        account_id: transaction.account_id,
        category_id: transaction.category_id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        created_by: transaction.created_by,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      }

      // Add to offline transactions table
      await this.db.transactions.add(serializedTransaction)

      // Add to sync queue
      await this.db.syncQueue.add({
        type: 'transaction',
        action: 'create',
        data: serializedTransaction,
        timestamp: Date.now(),
        synced: false
      })

      console.log('Created offline transaction:', offlineId)
      return offlineId
    } catch (error) {
      console.error('Error creating offline transaction:', error)
      throw error
    }
  }

  async updateOfflineTransaction(
    transactionId: string,
    updates: Partial<Transaction>
  ): Promise<void> {
    try {
      await this.db.transactions.update(transactionId, {
        ...updates,
        updated_at: new Date().toISOString()
      })

      // Add to sync queue
      await this.db.syncQueue.add({
        type: 'transaction',
        action: 'update',
        data: { id: transactionId, ...updates },
        originalId: transactionId,
        timestamp: Date.now(),
        synced: false
      })

      console.log('Updated offline transaction:', transactionId)
    } catch (error) {
      console.error('Error updating offline transaction:', error)
      throw error
    }
  }

  async deleteOfflineTransaction(transactionId: string): Promise<void> {
    try {
      await this.db.transactions.delete(transactionId)

      // Add to sync queue
      await this.db.syncQueue.add({
        type: 'transaction',
        action: 'delete',
        data: { id: transactionId },
        originalId: transactionId,
        timestamp: Date.now(),
        synced: false
      })

      console.log('Deleted offline transaction:', transactionId)
    } catch (error) {
      console.error('Error deleting offline transaction:', error)
      throw error
    }
  }

  // Sync management
  async getPendingSyncItems(): Promise<any[]> {
    try {
      return await this.db.syncQueue.where('synced').equals(0).toArray()
    } catch (error) {
      console.error('Error getting pending sync items:', error)
      return []
    }
  }

  async markSyncItemComplete(syncId: number, serverData?: any): Promise<void> {
    try {
      await this.db.syncQueue.update(syncId, { 
        synced: true,
        serverData: serverData
      })

      // If this was a create action, update the local record with server ID
      if (serverData?.id) {
        const syncItem = await this.db.syncQueue.get(syncId)
        if (syncItem && syncItem.action === 'create' && syncItem.type === 'transaction') {
          // Update local transaction with server ID
          const localTransaction = await this.db.transactions.get(syncItem.data.id)
          if (localTransaction) {
            await this.db.transactions.delete(syncItem.data.id)
            await this.db.transactions.add({
              ...localTransaction,
              id: serverData.id
            })
          }
        }
      }
    } catch (error) {
      console.error('Error marking sync item complete:', error)
    }
  }

  async clearSyncedItems(): Promise<void> {
    try {
      await this.db.syncQueue.where('synced').equals(1).delete()
      console.log('Cleared synced items from queue')
    } catch (error) {
      console.error('Error clearing synced items:', error)
    }
  }

  // Utility methods
  async isOnline(): Promise<boolean> {
    return navigator.onLine
  }

  async getStorageSize(): Promise<{ used: number; quota: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        }
      }
    } catch (error) {
      console.error('Error getting storage size:', error)
    }
    return { used: 0, quota: 0 }
  }

  async clearOfflineData(familyId?: string): Promise<void> {
    try {
      if (familyId) {
        await Promise.all([
          this.db.transactions.where('family_id').equals(familyId).delete(),
          this.db.accounts.where('family_id').equals(familyId).delete(),
          this.db.categories.where('family_id').equals(familyId).delete()
        ])
        console.log(`Cleared offline data for family: ${familyId}`)
      } else {
        await Promise.all([
          this.db.transactions.clear(),
          this.db.accounts.clear(),
          this.db.categories.clear(),
          this.db.syncQueue.clear()
        ])
        console.log('Cleared all offline data')
      }
    } catch (error) {
      console.error('Error clearing offline data:', error)
    }
  }
}

export const offlineStorageService = new OfflineStorageService()

// Auto-initialize when module loads
offlineStorageService.initialize().catch(console.error)