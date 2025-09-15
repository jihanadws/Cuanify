<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'
import { accountCategoryService } from '@/services/account'
import AppLayout from '@/components/AppLayout.vue'
import type { AccountForm, CategoryForm } from '@/types'

// Template and stores
const template = ref('')
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const router = useRouter()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const accounts = ref<any[]>([])
const categories = ref<any[]>([])
const selectedCategoryType = ref<'income' | 'expense'>('income')

// Modal state
const showAccountModal = ref(false)
const showCategoryModal = ref(false)
const isEditingAccount = ref(false)
const isEditingCategory = ref(false)
const editingAccountId = ref<string | null>(null)
const editingCategoryId = ref<string | null>(null)

// Form state
const accountForm = ref<AccountForm>({
  name: '',
  type: 'cash',
  balance: 0
})

const categoryForm = ref<CategoryForm>({
  name: '',
  type: 'expense',
  icon: 'dollar-sign',
  color: '#6B7280'
})

// Computed
const filteredCategories = computed(() => 
  categories.value.filter(cat => cat.type === selectedCategoryType.value)
)

// Load HTML template
onMounted(async () => {
  try {
    const response = await fetch('/src/templates/accounts.html')
    template.value = await response.text()
    
    setTimeout(() => {
      initializeAccounts()
      loadData()
    }, 100)
  } catch (error) {
    console.error('Failed to load accounts template:', error)
  }
})

// Initialize accounts page
const initializeAccounts = () => {
  setupModals()
  setupButtons()
  setupTabs()
}

// Load data
const loadData = async () => {
  if (!authStore.user?.family_id) {
    router.push('/family/setup')
    return
  }

  isLoading.value = true
  error.value = null

  try {
    await Promise.all([
      loadAccounts(),
      loadCategories()
    ])
  } catch (err) {
    error.value = 'Terjadi kesalahan saat memuat data'
  } finally {
    isLoading.value = false
  }
}

// Load accounts with stats
const loadAccounts = async () => {
  if (!authStore.user?.family_id) return

  const response = await accountCategoryService.getAccountStats(authStore.user.family_id)
  if (response.error) {
    throw new Error(response.error)
  }
  
  accounts.value = response.data || []
  updateAccountsDisplay()
}

// Load categories with stats
const loadCategories = async () => {
  if (!authStore.user?.family_id) return

  const response = await accountCategoryService.getCategoryStats(authStore.user.family_id)
  if (response.error) {
    throw new Error(response.error)
  }
  
  categories.value = response.data || []
  updateCategoriesDisplay()
}

// Setup modals
const setupModals = () => {
  // Account modal
  const accountModal = document.getElementById('account-modal')
  const closeAccountModal = document.getElementById('close-account-modal')
  const cancelAccount = document.getElementById('cancel-account')
  const accountForm = document.getElementById('account-form')

  if (closeAccountModal) {
    closeAccountModal.addEventListener('click', () => closeAccountModalFn())
  }

  if (cancelAccount) {
    cancelAccount.addEventListener('click', () => closeAccountModalFn())
  }

  if (accountModal) {
    accountModal.addEventListener('click', (e) => {
      if (e.target === accountModal) closeAccountModalFn()
    })
  }

  if (accountForm) {
    accountForm.addEventListener('submit', handleAccountSubmit)
  }

  // Category modal
  const categoryModal = document.getElementById('category-modal')
  const closeCategoryModal = document.getElementById('close-category-modal')
  const cancelCategory = document.getElementById('cancel-category')
  const categoryFormEl = document.getElementById('category-form')

  if (closeCategoryModal) {
    closeCategoryModal.addEventListener('click', () => closeCategoryModalFn())
  }

  if (cancelCategory) {
    cancelCategory.addEventListener('click', () => closeCategoryModalFn())
  }

  if (categoryModal) {
    categoryModal.addEventListener('click', (e) => {
      if (e.target === categoryModal) closeCategoryModalFn()
    })
  }

  if (categoryFormEl) {
    categoryFormEl.addEventListener('submit', handleCategorySubmit)
  }

  setupColorPicker()
}

// Setup buttons
const setupButtons = () => {
  const addAccountBtn = document.getElementById('add-account-btn')
  const addCategoryBtn = document.getElementById('add-category-btn')

  if (addAccountBtn) {
    addAccountBtn.addEventListener('click', () => openAccountModal())
  }

  if (addCategoryBtn) {
    addCategoryBtn.addEventListener('click', () => openCategoryModal())
  }
}

// Setup tabs
const setupTabs = () => {
  const tabButtons = document.querySelectorAll('.tab-btn')
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const type = button.getAttribute('data-type') as 'income' | 'expense'
      
      // Update active tab
      tabButtons.forEach(btn => btn.classList.remove('active'))
      button.classList.add('active')
      
      selectedCategoryType.value = type
      updateCategoriesDisplay()
    })
  })
}

// Setup color picker
const setupColorPicker = () => {
  const colorOptions = document.querySelectorAll('.color-option')
  const colorInput = document.getElementById('category-color') as HTMLInputElement

  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const color = option.getAttribute('data-color')
      if (color && colorInput) {
        colorInput.value = color
        categoryForm.value.color = color
        
        // Update visual selection
        colorOptions.forEach(opt => opt.classList.remove('selected'))
        option.classList.add('selected')
      }
    })
  })
}

// Open account modal
const openAccountModal = (account?: any) => {
  if (account) {
    isEditingAccount.value = true
    editingAccountId.value = account.id
    accountForm.value = {
      name: account.name,
      type: account.type,
      balance: Number(account.balance)
    }
  } else {
    isEditingAccount.value = false
    editingAccountId.value = null
    accountForm.value = {
      name: '',
      type: 'cash',
      balance: 0
    }
  }

  showAccountModal.value = true
  const modal = document.getElementById('account-modal')
  if (modal) {
    modal.classList.add('show')
  }

  updateAccountForm()
}

// Close account modal
const closeAccountModalFn = () => {
  showAccountModal.value = false
  const modal = document.getElementById('account-modal')
  if (modal) {
    modal.classList.remove('show')
  }
}

// Open category modal
const openCategoryModal = (category?: any) => {
  if (category) {
    isEditingCategory.value = true
    editingCategoryId.value = category.id
    categoryForm.value = {
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color
    }
  } else {
    isEditingCategory.value = false
    editingCategoryId.value = null
    categoryForm.value = {
      name: '',
      type: selectedCategoryType.value,
      icon: 'dollar-sign',
      color: '#6B7280'
    }
  }

  showCategoryModal.value = true
  const modal = document.getElementById('category-modal')
  if (modal) {
    modal.classList.add('show')
  }

  updateCategoryForm()
}

// Close category modal
const closeCategoryModalFn = () => {
  showCategoryModal.value = false
  const modal = document.getElementById('category-modal')
  if (modal) {
    modal.classList.remove('show')
  }
}

// Update account form
const updateAccountForm = () => {
  setTimeout(() => {
    const titleEl = document.getElementById('account-modal-title')
    const nameInput = document.getElementById('account-name') as HTMLInputElement
    const typeSelect = document.getElementById('account-type') as HTMLSelectElement
    const balanceInput = document.getElementById('account-balance') as HTMLInputElement

    if (titleEl) {
      titleEl.textContent = isEditingAccount.value ? 'Edit Akun' : 'Tambah Akun'
    }

    if (nameInput) {
      nameInput.value = accountForm.value.name
      nameInput.addEventListener('input', () => {
        accountForm.value.name = nameInput.value
      })
    }

    if (typeSelect) {
      typeSelect.value = accountForm.value.type
      typeSelect.addEventListener('change', () => {
        accountForm.value.type = typeSelect.value as any
      })
    }

    if (balanceInput) {
      balanceInput.value = accountForm.value.balance.toString()
      balanceInput.addEventListener('input', () => {
        accountForm.value.balance = Number(balanceInput.value)
      })
    }
  }, 50)
}

// Update category form
const updateCategoryForm = () => {
  setTimeout(() => {
    const titleEl = document.getElementById('category-modal-title')
    const nameInput = document.getElementById('category-name') as HTMLInputElement
    const typeSelect = document.getElementById('category-type') as HTMLSelectElement
    const iconSelect = document.getElementById('category-icon') as HTMLSelectElement
    const colorInput = document.getElementById('category-color') as HTMLInputElement

    if (titleEl) {
      titleEl.textContent = isEditingCategory.value ? 'Edit Kategori' : 'Tambah Kategori'
    }

    if (nameInput) {
      nameInput.value = categoryForm.value.name
      nameInput.addEventListener('input', () => {
        categoryForm.value.name = nameInput.value
      })
    }

    if (typeSelect) {
      typeSelect.value = categoryForm.value.type
      typeSelect.addEventListener('change', () => {
        categoryForm.value.type = typeSelect.value as any
      })
    }

    if (iconSelect) {
      iconSelect.value = categoryForm.value.icon
      iconSelect.addEventListener('change', () => {
        categoryForm.value.icon = iconSelect.value
      })
    }

    if (colorInput) {
      colorInput.value = categoryForm.value.color
      
      // Update color picker selection
      const colorOptions = document.querySelectorAll('.color-option')
      colorOptions.forEach(option => {
        option.classList.remove('selected')
        if (option.getAttribute('data-color') === categoryForm.value.color) {
          option.classList.add('selected')
        }
      })
    }
  }, 50)
}

// Handle account form submit
const handleAccountSubmit = async (event: Event) => {
  event.preventDefault()

  if (!authStore.user?.family_id) return

  isLoading.value = true
  error.value = null

  try {
    if (isEditingAccount.value && editingAccountId.value) {
      const response = await accountCategoryService.updateAccount(editingAccountId.value, accountForm.value)
      if (response.error) {
        error.value = response.error
        return
      }
    } else {
      const response = await accountCategoryService.createAccount(
        authStore.user.family_id,
        authStore.user.id,
        accountForm.value
      )
      if (response.error) {
        error.value = response.error
        return
      }
    }

    closeAccountModalFn()
    await loadAccounts()
  } catch (err) {
    error.value = 'Terjadi kesalahan saat menyimpan akun'
  } finally {
    isLoading.value = false
  }
}

// Handle category form submit
const handleCategorySubmit = async (event: Event) => {
  event.preventDefault()

  if (!authStore.user?.family_id) return

  isLoading.value = true
  error.value = null

  try {
    if (isEditingCategory.value && editingCategoryId.value) {
      const response = await accountCategoryService.updateCategory(editingCategoryId.value, categoryForm.value)
      if (response.error) {
        error.value = response.error
        return
      }
    } else {
      const response = await accountCategoryService.createCategory(
        authStore.user.family_id,
        authStore.user.id,
        categoryForm.value
      )
      if (response.error) {
        error.value = response.error
        return
      }
    }

    closeCategoryModalFn()
    await loadCategories()
  } catch (err) {
    error.value = 'Terjadi kesalahan saat menyimpan kategori'
  } finally {
    isLoading.value = false
  }
}

// Update accounts display
const updateAccountsDisplay = () => {
  const accountsGrid = document.getElementById('accounts-grid')
  if (!accountsGrid) return

  if (accounts.value.length === 0) {
    accountsGrid.innerHTML = `
      <div class="empty-state col-span-full">
        <i class="icon-credit-card"></i>
        <h3>Belum ada akun</h3>
        <p>Tambahkan akun pertama untuk mulai mencatat transaksi</p>
      </div>
    `
    return
  }

  accountsGrid.innerHTML = accounts.value.map(account => {
    const balance = transactionStore.formatCurrency(Number(account.balance))
    const typeLabel = ({
      cash: 'Tunai',
      bank: 'Bank',
      credit: 'Kredit',
      investment: 'Investasi'
    } as Record<string, string>)[account.type] || account.type

    return `
      <div class="account-card ${account.type}">
        <div class="account-header">
          <span class="account-name">${account.name}</span>
          <span class="account-type ${account.type}">${typeLabel}</span>
        </div>
        <div class="account-balance">${balance}</div>
        <div class="account-stats">
          ${account.transaction_count || 0} transaksi
        </div>
        <div class="account-actions">
          <button onclick="editAccount('${account.id}')" class="edit-account-btn">
            Edit
          </button>
          <button onclick="deleteAccount('${account.id}')" class="delete-account-btn">
            Hapus
          </button>
        </div>
      </div>
    `
  }).join('')

  // Make functions available globally
  ;(window as any).editAccount = (id: string) => {
    const account = accounts.value.find(a => a.id === id)
    if (account) openAccountModal(account)
  }

  ;(window as any).deleteAccount = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
      const response = await accountCategoryService.deleteAccount(id)
      if (response.error) {
        alert(response.error)
      } else {
        await loadAccounts()
      }
    }
  }
}

// Update categories display
const updateCategoriesDisplay = () => {
  const categoriesGrid = document.getElementById('categories-grid')
  if (!categoriesGrid) return

  const filtered = filteredCategories.value

  if (filtered.length === 0) {
    categoriesGrid.innerHTML = `
      <div class="empty-state col-span-full">
        <i class="icon-tag"></i>
        <h3>Belum ada kategori ${selectedCategoryType.value === 'income' ? 'pemasukan' : 'pengeluaran'}</h3>
        <p>Tambahkan kategori untuk mengorganisir transaksi</p>
      </div>
    `
    return
  }

  categoriesGrid.innerHTML = filtered.map(category => {
    const amount = transactionStore.formatCurrency(Number(category.total_amount || 0))
    
    return `
      <div class="category-card" style="border-color: ${category.color}33;">
        <div class="category-header">
          <div class="category-icon" style="background-color: ${category.color};">
            ${getCategoryIcon(category.icon)}
          </div>
        </div>
        <div class="category-name">${category.name}</div>
        <div class="category-amount ${category.type}">${amount}</div>
        <div class="category-stats">
          ${category.transaction_count || 0} transaksi
        </div>
        <div class="category-actions">
          <button onclick="editCategory('${category.id}')" class="edit-category-btn">
            Edit
          </button>
          <button onclick="deleteCategory('${category.id}')" class="delete-category-btn">
            Hapus
          </button>
        </div>
      </div>
    `
  }).join('')

  // Make functions available globally
  ;(window as any).editCategory = (id: string) => {
    const category = categories.value.find(c => c.id === id)
    if (category) openCategoryModal(category)
  }

  ;(window as any).deleteCategory = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
      const response = await accountCategoryService.deleteCategory(id)
      if (response.error) {
        alert(response.error)
      } else {
        await loadCategories()
      }
    }
  }
}

// Get category icon
const getCategoryIcon = (iconName: string): string => {
  const icons: Record<string, string> = {
    'dollar-sign': '💰',
    'coffee': '☕',
    'car': '🚗',
    'home': '🏠',
    'shopping-bag': '🛍️',
    'heart': '❤️',
    'smile': '😊',
    'book': '📚',
    'briefcase': '💼',
    'gift': '🎁',
    'trending-up': '📈',
    'file-text': '📄'
  }
  return icons[iconName] || '💰'
}

// Clear error
const clearError = () => {
  error.value = null
}
</script>

<template>
  <AppLayout page-title="Akun & Kategori">
    <!-- Load external CSS -->
    <link rel="stylesheet" href="/src/styles/accounts.css">
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Memuat data...</p>
    </div>
    
    <!-- Error state -->
    <div v-if="error" class="error-container">
      <div class="error-message">
        <i class="icon-alert-circle"></i>
        <p>{{ error }}</p>
        <button @click="clearError" class="retry-btn">Tutup</button>
      </div>
    </div>
    
    <!-- Main content -->
    <div 
      v-show="!isLoading"
      v-html="template"
    ></div>
  </AppLayout>
</template>


<style scoped>
/* Loading container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 16rem;
  gap: 1rem;
}
.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 4px solid #bfdbfe;
  border-top: 4px solid #2563eb;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
}
.error-message {
  text-align: center;
  gap: 1rem;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
}
.error-message i {
  width: 3rem;
  height: 3rem;
  color: #ef4444;
  display: block;
  margin: 0 auto 1rem auto;
}
.error-message p {
  color: #64748b;
}
.retry-btn {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: #fff;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.retry-btn:hover {
  background: #1d4ed8;
}
</style>