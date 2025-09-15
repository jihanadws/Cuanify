<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'
import AppLayout from '@/components/AppLayout.vue'
import type { TransactionForm } from '@/types'

// Template and stores
const template = ref('')
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const router = useRouter()
const route = useRoute()

// Form state
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const transactionForm = ref<TransactionForm>({
  type: 'expense',
  amount: 0,
  description: '',
  category_id: '',
  account_id: '',
  date: new Date().toISOString().split('T')[0]
})

// Filter state
const filters = ref({
  type: 'all',
  category_id: '',
  account_id: '',
  date_period: 'this-month'
})

// Computed properties
const filteredTransactions = computed(() => transactionStore.filteredTransactions)
const accounts = computed(() => transactionStore.accounts)
const categories = computed(() => transactionStore.categories)
const incomeCategories = computed(() => transactionStore.incomeCategories)
const expenseCategories = computed(() => transactionStore.expenseCategories)

// Load HTML template
onMounted(async () => {
  try {
    const response = await fetch('/src/templates/transactions.html')
    template.value = await response.text()
    
    // Initialize after template loads
    setTimeout(() => {
      initializeTransactions()
      loadTransactionsData()
      checkUrlParams()
    }, 100)
  } catch (error) {
    console.error('Failed to load transactions template:', error)
  }
})

// Check URL parameters for auto-opening add modal
const checkUrlParams = () => {
  if (route.query.add === 'true') {
    const type = route.query.type as 'income' | 'expense'
    if (type && ['income', 'expense'].includes(type)) {
      transactionForm.value.type = type
    }
    openModal()
  }
}

// Initialize transactions page
const initializeTransactions = () => {
  setupFilters()
  setupModal()
  setupAddButton()
  setupTableActions()
}

// Load transactions data
const loadTransactionsData = async () => {
  if (!authStore.user?.family_id) {
    router.push('/family/setup')
    return
  }

  await Promise.all([
    transactionStore.loadTransactions(authStore.user.family_id),
    transactionStore.loadAccounts(authStore.user.family_id),
    transactionStore.loadCategories(authStore.user.family_id)
  ])

  updateTransactionsTable()
  updateFilterOptions()
  updateSummary()
}

// Setup filters
const setupFilters = () => {
  const filterType = document.getElementById('filter-type') as HTMLSelectElement
  const filterCategory = document.getElementById('filter-category') as HTMLSelectElement
  const filterAccount = document.getElementById('filter-account') as HTMLSelectElement
  const filterDate = document.getElementById('filter-date') as HTMLSelectElement

  if (filterType) {
    filterType.addEventListener('change', () => {
      filters.value.type = filterType.value
      applyFilters()
    })
  }

  if (filterCategory) {
    filterCategory.addEventListener('change', () => {
      filters.value.category_id = filterCategory.value
      applyFilters()
    })
  }

  if (filterAccount) {
    filterAccount.addEventListener('change', () => {
      filters.value.account_id = filterAccount.value
      applyFilters()
    })
  }

  if (filterDate) {
    filterDate.addEventListener('change', () => {
      filters.value.date_period = filterDate.value
      applyFilters()
    })
  }
}

// Setup modal
const setupModal = () => {
  const modal = document.getElementById('transaction-modal')
  const closeBtn = document.getElementById('close-transaction-modal')
  const cancelBtn = document.getElementById('cancel-transaction')
  const form = document.getElementById('transaction-form')

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal)
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal)
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal()
      }
    })
  }

  if (form) {
    form.addEventListener('submit', handleFormSubmit)
  }
}

// Setup add button
const setupAddButton = () => {
  const addBtn = document.querySelector('.add-transaction-btn')
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      openModal()
    })
  }
}

// Setup table actions
const setupTableActions = () => {
  // This will be called after table is updated
}

// Open modal
const openModal = (transaction?: any) => {
  if (transaction) {
    isEditing.value = true
    editingId.value = transaction.id
    transactionForm.value = {
      type: transaction.type,
      amount: Number(transaction.amount),
      description: transaction.description || '',
      category_id: transaction.category_id,
      account_id: transaction.account_id,
      date: transaction.date
    }
  } else {
    isEditing.value = false
    editingId.value = null
    // Ambil type dari URL jika ada, default ke 'expense' jika tidak
    let urlType = route.query.type
    let type: 'income' | 'expense' = 'expense';
    if (urlType === 'income' || urlType === 'expense') {
      type = urlType;
    }
    transactionForm.value = {
      type,
      amount: 0,
      description: '',
      category_id: '',
      account_id: '',
      date: new Date().toISOString().split('T')[0]
    }
  }

  showModal.value = true
  const modal = document.getElementById('transaction-modal')
  if (modal) {
    modal.classList.add('show')
  }

  updateModalForm()
}

// Close modal
const closeModal = () => {
  showModal.value = false
  const modal = document.getElementById('transaction-modal')
  if (modal) {
    modal.classList.remove('show')
  }
}

// Update modal form
const updateModalForm = () => {
  setTimeout(() => {
    const titleEl = document.getElementById('transaction-modal-title')
    const typeSelect = document.getElementById('transaction-type') as HTMLSelectElement
    const amountInput = document.getElementById('transaction-amount') as HTMLInputElement
    const categorySelect = document.getElementById('transaction-category') as HTMLSelectElement
    const accountSelect = document.getElementById('transaction-account') as HTMLSelectElement
    const dateInput = document.getElementById('transaction-date') as HTMLInputElement
    const descriptionInput = document.getElementById('transaction-description') as HTMLTextAreaElement

    if (titleEl) {
      titleEl.textContent = isEditing.value ? 'Edit Transaksi' : 'Tambah Transaksi'
    }

    if (typeSelect) {
      typeSelect.value = transactionForm.value.type
      typeSelect.addEventListener('change', () => {
        transactionForm.value.type = typeSelect.value as 'income' | 'expense'
        updateCategoryOptions()
      })
    }

    if (amountInput) {
      amountInput.value = transactionForm.value.amount.toString()
      amountInput.addEventListener('input', () => {
        transactionForm.value.amount = Number(amountInput.value)
      })
    }

    if (dateInput) {
      dateInput.value = transactionForm.value.date
      dateInput.addEventListener('change', () => {
        transactionForm.value.date = dateInput.value
      })
    }

    if (descriptionInput) {
      descriptionInput.value = transactionForm.value.description
      descriptionInput.addEventListener('input', () => {
        transactionForm.value.description = descriptionInput.value
      })
    }

    updateCategoryOptions()
    updateAccountOptions()
  }, 50)
}

// Handle form submit
const handleFormSubmit = async (event: Event) => {
  event.preventDefault()

  if (!authStore.user?.family_id) return

  if (isEditing.value && editingId.value) {
    const success = await transactionStore.updateTransaction(editingId.value, transactionForm.value)
    if (success) {
      closeModal()
      updateTransactionsTable()
      updateSummary()
    }
  } else {
    const success = await transactionStore.createTransaction(
      authStore.user.family_id,
      authStore.user.id,
      transactionForm.value
    )
    if (success) {
      closeModal()
      updateTransactionsTable()
      updateSummary()
    }
  }
}

// Apply filters
const applyFilters = () => {
  const filterParams: any = {}
  
  if (filters.value.type !== 'all') {
    filterParams.type = filters.value.type
  }
  
  if (filters.value.category_id) {
    filterParams.category_id = filters.value.category_id
  }
  
  if (filters.value.account_id) {
    filterParams.account_id = filters.value.account_id
  }

  // Handle date filtering
  const now = new Date()
  if (filters.value.date_period === 'this-month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    filterParams.date_from = startOfMonth.toISOString().split('T')[0]
    filterParams.date_to = endOfMonth.toISOString().split('T')[0]
  }

  transactionStore.setFilters(filterParams)
  updateTransactionsTable()
  updateSummary()
}

// Update transactions table
const updateTransactionsTable = () => {
  const tableBody = document.getElementById('transactions-table-body')
  if (!tableBody) return

  const transactions = filteredTransactions.value

  if (transactions.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-gray-500">
          Belum ada transaksi
        </td>
      </tr>
    `
    return
  }

  tableBody.innerHTML = transactions.map(transaction => {
    const isIncome = transaction.type === 'income'
    const amount = transactionStore.formatCurrency(Number(transaction.amount))
    const date = new Date(transaction.date).toLocaleDateString('id-ID')
    const category = transaction.category?.name || 'Tidak ada kategori'
    const account = transaction.account?.name || 'Tidak ada akun'
    const user = transaction.user?.full_name || 'Unknown'

    return `
      <tr>
        <td>${date}</td>
        <td>${transaction.description || category}</td>
        <td>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }">
            ${category}
          </span>
        </td>
        <td>${account}</td>
        <td class="font-semibold ${
          isIncome ? 'text-green-600' : 'text-red-600'
        }">${isIncome ? '+' : '-'}${amount}</td>
        <td>${user}</td>
        <td>
          <button onclick="editTransaction('${transaction.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
            Edit
          </button>
          <button onclick="deleteTransaction('${transaction.id}')" class="text-red-600 hover:text-red-800">
            Hapus
          </button>
        </td>
      </tr>
    `
  }).join('')

  // Make edit/delete functions available globally
  ;(window as any).editTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id)
    if (transaction) {
      openModal(transaction)
    }
  }

  ;(window as any).deleteTransaction = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      const success = await transactionStore.deleteTransaction(id)
      if (success) {
        updateTransactionsTable()
        updateSummary()
      }
    }
  }
}

// Update filter options
const updateFilterOptions = () => {
  const categorySelect = document.getElementById('filter-category') as HTMLSelectElement
  const accountSelect = document.getElementById('filter-account') as HTMLSelectElement

  if (categorySelect) {
    categorySelect.innerHTML = '<option value="">Semua Kategori</option>' +
      categories.value.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')
  }

  if (accountSelect) {
    accountSelect.innerHTML = '<option value="">Semua Akun</option>' +
      accounts.value.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')
  }
}

// Update category options in modal
const updateCategoryOptions = () => {
  const categorySelect = document.getElementById('transaction-category') as HTMLSelectElement
  if (!categorySelect) return

  const relevantCategories = transactionForm.value.type === 'income' 
    ? incomeCategories.value 
    : expenseCategories.value

  categorySelect.innerHTML = '<option value="">Pilih kategori</option>' +
    relevantCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('')

  if (transactionForm.value.category_id) {
    categorySelect.value = transactionForm.value.category_id
  }

  categorySelect.addEventListener('change', () => {
    transactionForm.value.category_id = categorySelect.value
  })
}

// Update account options in modal
const updateAccountOptions = () => {
  const accountSelect = document.getElementById('transaction-account') as HTMLSelectElement
  if (!accountSelect) return

  accountSelect.innerHTML = '<option value="">Pilih akun</option>' +
    accounts.value.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')

  if (transactionForm.value.account_id) {
    accountSelect.value = transactionForm.value.account_id
  }

  accountSelect.addEventListener('change', () => {
    transactionForm.value.account_id = accountSelect.value
  })
}

// Update summary
const updateSummary = () => {
  const transactions = filteredTransactions.value
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = totalIncome - totalExpense

  const incomeEl = document.getElementById('filtered-income')
  const expenseEl = document.getElementById('filtered-expense')
  const balanceEl = document.getElementById('filtered-balance')

  if (incomeEl) incomeEl.textContent = transactionStore.formatCurrency(totalIncome)
  if (expenseEl) expenseEl.textContent = transactionStore.formatCurrency(totalExpense)
  if (balanceEl) {
    balanceEl.textContent = transactionStore.formatCurrency(Math.abs(balance))
    balanceEl.className = `summary-value ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`
  }
}

// Watch for data changes
watch(() => transactionStore.transactions, () => {
  updateTransactionsTable()
  updateSummary()
}, { deep: true })
</script>

<template>
  <AppLayout page-title="Transaksi">
    <!-- Load external CSS -->
    <link rel="stylesheet" href="/src/styles/transactions.css">
    
    <!-- Loading state -->
    <div v-if="transactionStore.isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Memuat data transaksi...</p>
    </div>
    
    <!-- Error state -->
    <div v-if="transactionStore.error" class="error-container">
      <div class="error-message">
        <i class="icon-alert-circle"></i>
        <p>{{ transactionStore.error }}</p>
        <button @click="loadTransactionsData" class="retry-btn">Coba Lagi</button>
      </div>
    </div>
    
    <!-- HTML Template -->
    <div 
      v-show="!transactionStore.isLoading && !transactionStore.error"
      v-html="template"
    ></div>
  </AppLayout>
</template>

<style scoped>
.loading-container {
  @apply flex flex-col items-center justify-center h-64 space-y-4;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin;
}

.error-container {
  @apply flex items-center justify-center h-64;
}

.error-message {
  @apply text-center space-y-4 max-w-md mx-auto;
}

.error-message i {
  @apply w-12 h-12 text-red-500 mx-auto mb-4;
}

.error-message p {
  @apply text-gray-600;
}

.retry-btn {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors;
}

/* Override modal display */
:deep(.modal.show) {
  @apply block;
}

/* Transaction form enhancements */
:deep(.transaction-form input:invalid) {
  @apply border-red-300 focus:border-red-500 focus:ring-red-500;
}

:deep(.transaction-form .form-group.error input) {
  @apply border-red-300;
}

:deep(.transaction-form .form-group.error label) {
  @apply text-red-700;
}

/* Table enhancements */
:deep(.transactions-table tbody tr:hover) {
  @apply bg-blue-50;
}

:deep(.transactions-table button) {
  @apply text-sm font-medium transition-colors;
}

/* Responsive table */
@media (max-width: 768px) {
  :deep(.transactions-table-container) {
    @apply overflow-x-auto;
  }
  
  :deep(.transactions-table) {
    @apply text-sm;
  }
  
  :deep(.transactions-table th),
  :deep(.transactions-table td) {
    @apply px-3 py-2;
  }
}

/* Filter section responsive */
@media (max-width: 768px) {
  :deep(.filter-section) {
    @apply grid-cols-1 gap-2;
  }
  
  :deep(.transactions-summary) {
    @apply grid-cols-1 gap-2;
  }
}

/* Modal responsive */
@media (max-width: 768px) {
  :deep(.modal-content) {
    @apply mx-2 max-w-none;
  }
  
  :deep(.form-row) {
    @apply grid-cols-1;
  }
}
</style>