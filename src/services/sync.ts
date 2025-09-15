import { offlineStorageService } from './offline'
import { transactionService } from './transaction'
import { accountCategoryService } from './account'
import { supabase } from './supabase'

export class SyncService {
  private syncInProgress = false
  private syncInterval: number | null = null
  private onlineStatusListener: (() => void) | null = null

  // Initialize sync service
  async initialize(): Promise<void> {
    try {
      // Setup online/offline event listeners
      this.setupNetworkListeners()
      
      // Start periodic sync if online
      if (navigator.onLine) {
        this.startPeriodicSync()
      }

      console.log('Sync service initialized')
    } catch (error) {
      console.error('Failed to initialize sync service:', error)
    }
  }

  // Setup network status listeners
  private setupNetworkListeners(): void {
    this.onlineStatusListener = () => {
      if (navigator.onLine) {
        console.log('App is back online, starting sync...')
        this.syncAll()
        this.startPeriodicSync()
      } else {
        console.log('App is offline, stopping periodic sync')
        this.stopPeriodicSync()
      }
    }

    window.addEventListener('online', this.onlineStatusListener)
    window.addEventListener('offline', this.onlineStatusListener)
  }

  // Start periodic sync
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    // Sync every 30 seconds when online
    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncAll()
      }
    }, 30000)
  }

  // Stop periodic sync
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Sync all pending changes
  async syncAll(): Promise<{ success: boolean; errors: string[] }> {
    if (this.syncInProgress || !navigator.onLine) {
      return { success: false, errors: ['Sync already in progress or offline'] }
    }

    this.syncInProgress = true
    const errors: string[] = []

    try {
      console.log('Starting sync process...')

      // Get pending sync items
      const pendingItems = await offlineStorageService.getPendingSyncItems()
      
      if (pendingItems.length === 0) {
        console.log('No pending sync items')
        return { success: true, errors: [] }
      }

      console.log(`Found ${pendingItems.length} items to sync`)

      // Process each pending item
      for (const item of pendingItems) {
        try {
          await this.syncItem(item)
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error)
          errors.push(`Failed to sync ${item.type} ${item.action}: ${error}`)
        }
      }

      // Clear successfully synced items
      await offlineStorageService.clearSyncedItems()

      console.log(`Sync completed. ${errors.length} errors.`)
      return { success: errors.length === 0, errors }
    } catch (error) {
      console.error('Sync process failed:', error)
      errors.push(`Sync process failed: ${error}`)
      return { success: false, errors }
    } finally {
      this.syncInProgress = false
    }
  }

  // Sync individual item
  private async syncItem(item: any): Promise<void> {
    const { type, action, data, id } = item

    try {
      switch (type) {
        case 'transaction':
          await this.syncTransaction(action, data, id)
          break
        case 'account':
          await this.syncAccount(action, data, id)
          break
        case 'category':
          await this.syncCategory(action, data, id)
          break
        default:
          throw new Error(`Unknown sync type: ${type}`)
      }

      // Mark item as synced
      await offlineStorageService.markSyncItemComplete(id)
    } catch (error) {
      console.error(`Failed to sync ${type} ${action}:`, error)
      throw error
    }
  }

  // Sync transaction
  private async syncTransaction(action: string, data: any, syncId: number): Promise<void> {
    const familyId = data.family_id
    const userId = data.created_by

    switch (action) {
      case 'create':
        // Remove the offline ID and create on server
        const { id, ...transactionData } = data
        const response = await transactionService.createTransaction(familyId, userId, transactionData)
        
        if (response.error) {
          throw new Error(response.error)
        }

        // Update local record with server data
        await offlineStorageService.markSyncItemComplete(syncId, response.data)
        break

      case 'update':
        const updateResponse = await transactionService.updateTransaction(data.id, data)
        
        if (updateResponse.error) {
          throw new Error(updateResponse.error)
        }

        await offlineStorageService.markSyncItemComplete(syncId, updateResponse.data)
        break

      case 'delete':
        const deleteResponse = await transactionService.deleteTransaction(data.id)
        
        if (deleteResponse.error) {
          throw new Error(deleteResponse.error)
        }

        await offlineStorageService.markSyncItemComplete(syncId)
        break

      default:
        throw new Error(`Unknown transaction action: ${action}`)
    }
  }

  // Sync account
  private async syncAccount(action: string, data: any, syncId: number): Promise<void> {
    const familyId = data.family_id
    const userId = data.created_by

    switch (action) {
      case 'create':
        const { id, ...accountData } = data
        const response = await accountCategoryService.createAccount(familyId, userId, accountData)
        
        if (response.error) {
          throw new Error(response.error)
        }

        await offlineStorageService.markSyncItemComplete(syncId, response.data)
        break

      case 'update':
        const updateResponse = await accountCategoryService.updateAccount(data.id, data)
        
        if (updateResponse.error) {
          throw new Error(updateResponse.error)
        }

        await offlineStorageService.markSyncItemComplete(syncId, updateResponse.data)
        break

      case 'delete':
        const deleteResponse = await accountCategoryService.deleteAccount(data.id)
        
        if (deleteResponse.error) {
          throw new Error(deleteResponse.error)
        }

        await offlineStorageService.markSyncItemComplete(syncId)
        break

      default:
        throw new Error(`Unknown account action: ${action}`)
    }
  }

  // Sync category
  private async syncCategory(action: string, data: any, syncId: number): Promise<void> {
    const familyId = data.family_id
    const userId = data.created_by

    switch (action) {
      case 'create':
        const { id, ...categoryData } = data
        const response = await accountCategoryService.createCategory(familyId, userId, categoryData)
        
        if (response.error) {
          throw new Error(response.error)
        }

        await offlineStorageService.markSyncItemComplete(syncId, response.data)
        break

      case 'update':
        const updateResponse = await accountCategoryService.updateCategory(data.id, data)
        
        if (updateResponse.error) {
          throw new Error(updateResponse.error)
        }

        await offlineStorageService.markSyncItemComplete(syncId, updateResponse.data)
        break

      case 'delete':
        const deleteResponse = await accountCategoryService.deleteCategory(data.id)
        
        if (deleteResponse.error) {
          throw new Error(deleteResponse.error)
        }

        await offlineStorageService.markSyncItemComplete(syncId)
        break

      default:
        throw new Error(`Unknown category action: ${action}`)
    }
  }

  // Download and cache data from server
  async downloadAndCache(familyId: string): Promise<void> {
    if (!navigator.onLine) {
      console.log('Cannot download data while offline')
      return
    }

    try {
      console.log('Downloading and caching data...')

      // Download data from server
      const [transactionsResponse, accountsResponse, categoriesResponse] = await Promise.all([
        transactionService.getTransactions(familyId),
        transactionService.getAccounts(familyId),
        transactionService.getCategories(familyId)
      ])

      // Cache data for offline access
      if (transactionsResponse.data) {
        await offlineStorageService.cacheTransactions(familyId, transactionsResponse.data)
      }

      if (accountsResponse.data) {
        await offlineStorageService.cacheAccounts(familyId, accountsResponse.data)
      }

      if (categoriesResponse.data) {
        await offlineStorageService.cacheCategories(familyId, categoriesResponse.data)
      }

      console.log('Data downloaded and cached successfully')
    } catch (error) {
      console.error('Failed to download and cache data:', error)
      throw error
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean
    pendingItems: number
    lastSyncTime: string | null
    syncInProgress: boolean
  }> {
    const pendingItems = await offlineStorageService.getPendingSyncItems()
    
    return {
      isOnline: navigator.onLine,
      pendingItems: pendingItems.length,
      lastSyncTime: localStorage.getItem('lastSyncTime'),
      syncInProgress: this.syncInProgress
    }
  }

  // Force sync now
  async forceSyncNow(): Promise<{ success: boolean; errors: string[] }> {
    if (!navigator.onLine) {
      return { success: false, errors: ['Cannot sync while offline'] }
    }

    return await this.syncAll()
  }

  // Cleanup
  destroy(): void {
    this.stopPeriodicSync()
    
    if (this.onlineStatusListener) {
      window.removeEventListener('online', this.onlineStatusListener)
      window.removeEventListener('offline', this.onlineStatusListener)
    }
  }
}

export const syncService = new SyncService()