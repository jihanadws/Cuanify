<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transaction'
import AppLayout from '@/components/AppLayout.vue'

// Template and stores
const template = ref('')
const authStore = useAuthStore()
const transactionStore = useTransactionStore()
const router = useRouter()

// Load HTML template
onMounted(async () => {
  try {
  const response = await fetch('/dashboard.html')
    template.value = await response.text()
    
    // Initialize dashboard after template loads
    setTimeout(() => {
      initializeDashboard()
      loadDashboardData()
    }, 100)
  } catch (error) {
    console.error('Failed to load dashboard template:', error)
  }
})

// Computed properties
const stats = computed(() => transactionStore.dashboardStats)
const recentTransactions = computed(() => stats.value?.recentTransactions || [])

// Initialize dashboard
const initializeDashboard = () => {
  setupQuickActions()
  updateStatsDisplay()
}

// Load dashboard data
const loadDashboardData = async () => {
  if (!authStore.user?.family_id) {
    router.push('/family/setup')
    return
  }

  // Load dashboard stats and basic data
  await Promise.all([
    transactionStore.loadDashboardStats(authStore.user.family_id),
    transactionStore.loadAccounts(authStore.user.family_id),
    transactionStore.loadCategories(authStore.user.family_id)
  ])

  // Update display after data loads
  updateStatsDisplay()
  updateRecentTransactions()
}

// Setup quick actions
const setupQuickActions = () => {
  const incomeBtn = document.querySelector('.income-btn')
  const expenseBtn = document.querySelector('.expense-btn')
  const viewAllLink = document.querySelector('.view-all-link')

  if (incomeBtn) {
    incomeBtn.addEventListener('click', () => {
      router.push('/transactions?type=income&add=true')
    })
  }

  if (expenseBtn) {
    expenseBtn.addEventListener('click', () => {
      router.push('/transactions?type=expense&add=true')
    })
  }

  if (viewAllLink) {
    viewAllLink.addEventListener('click', (e) => {
      e.preventDefault()
      router.push('/transactions')
    })
  }
}

// Update stats display
const updateStatsDisplay = () => {
  if (!stats.value) return

  const totalIncomeEl = document.getElementById('total-income')
  const totalExpenseEl = document.getElementById('total-expense')
  const totalBalanceEl = document.getElementById('total-balance')

  if (totalIncomeEl) {
    totalIncomeEl.textContent = transactionStore.formatCurrency(stats.value.totalIncome)
  }

  if (totalExpenseEl) {
    totalExpenseEl.textContent = transactionStore.formatCurrency(stats.value.totalExpense)
  }

  if (totalBalanceEl) {
    totalBalanceEl.textContent = transactionStore.formatCurrency(stats.value.totalBalance)
  }
}

// Update recent transactions
const updateRecentTransactions = () => {
  const transactionsList = document.getElementById('recent-transactions-list')
  
  if (!transactionsList) return

  if (recentTransactions.value.length === 0) {
    transactionsList.innerHTML = `
      <div class="empty-state">
        <p class="text-gray-500 text-center py-8">Belum ada transaksi bulan ini</p>
      </div>
    `
    return
  }

  const transactionsHTML = recentTransactions.value.map(transaction => {
    const isIncome = transaction.type === 'income'
    const amount = transactionStore.formatCurrency(Number(transaction.amount))
    const category = transaction.category?.name || 'Tidak ada kategori'
    const account = transaction.account?.name || 'Tidak ada akun'
    const user = transaction.user?.full_name || 'Unknown'
    const date = new Date(transaction.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    })

    return `
      <div class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-icon ${isIncome ? 'income' : 'expense'}">
            <i class="icon-${isIncome ? 'plus' : 'minus'}"></i>
          </div>
          <div class="transaction-details">
            <h4>${transaction.description || category}</h4>
            <p class="transaction-meta">${category} • ${account} • ${user}</p>
          </div>
        </div>
        <div class="transaction-amount">
          <span class="amount ${isIncome ? 'income' : 'expense'}">${amount}</span>
          <span class="transaction-date">${date}</span>
        </div>
      </div>
    `
  }).join('')

  transactionsList.innerHTML = transactionsHTML
}

// Watch for data changes
const unwatchStats = computed(() => {
  if (stats.value) {
    setTimeout(updateStatsDisplay, 0)
    setTimeout(updateRecentTransactions, 0)
  }
})
</script>

<template>
  <AppLayout page-title="Dashboard">
    <!-- Load external CSS -->
  <!-- CSS sudah diimport di main.ts, tidak perlu <link> manual -->
    
    <!-- Loading state -->
    <div v-if="transactionStore.isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Memuat data dashboard...</p>
    </div>
    
    <!-- Error state -->
    <div v-if="transactionStore.error" class="error-container">
      <div class="error-message">
        <i class="icon-alert-circle"></i>
        <p>{{ transactionStore.error }}</p>
        <button @click="loadDashboardData" class="retry-btn">Coba Lagi</button>
      </div>
    </div>
    
    <!-- Dashboard content -->
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

/* Transaction item styles */
:deep(.transaction-item) {
  @apply flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors;
}

:deep(.transaction-info) {
  @apply flex items-center space-x-3;
}

:deep(.transaction-icon) {
  @apply w-10 h-10 rounded-full flex items-center justify-center;
}

:deep(.transaction-icon.income) {
  @apply bg-green-100 text-green-600;
}

:deep(.transaction-icon.expense) {
  @apply bg-red-100 text-red-600;
}

:deep(.transaction-details h4) {
  @apply font-medium text-gray-900 text-sm;
}

:deep(.transaction-meta) {
  @apply text-xs text-gray-500 mt-1;
}

:deep(.transaction-amount) {
  @apply text-right;
}

:deep(.amount) {
  @apply font-semibold text-sm;
}

:deep(.amount.income) {
  @apply text-green-600;
}

:deep(.amount.expense) {
  @apply text-red-600;
}

:deep(.transaction-date) {
  @apply text-xs text-gray-500 block mt-1;
}

:deep(.empty-state) {
  @apply flex items-center justify-center h-32;
}
</style>