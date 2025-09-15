<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Template loading
const template = ref('')
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// Responsive state
const isMobile = ref(false)
const sidebarOpen = ref(false)

// Load HTML template
onMounted(async () => {
  try {
    const response = await fetch('/src/templates/layout.html')
    template.value = await response.text()
    
    // Initialize after template loads
    setTimeout(() => {
      initializeLayout()
      updateUserInfo()
    }, 100)
  } catch (error) {
    console.error('Failed to load layout template:', error)
  }
  
  // Check initial screen size
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})

// Screen size detection
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768
  
  const sidebar = document.getElementById('sidebar')
  const bottomNav = document.getElementById('bottom-nav')
  
  if (sidebar && bottomNav) {
    if (isMobile.value) {
      sidebar.style.display = 'none'
      bottomNav.style.display = 'flex'
    } else {
      sidebar.style.display = 'flex'
      bottomNav.style.display = 'none'
    }
  }
}

// Initialize layout functionality
const initializeLayout = () => {
  setupNavigation()
  setupQuickAdd()
  setupLogout()
  updateActiveRoute()
}

// Setup navigation
const setupNavigation = () => {
  const menuItems = document.querySelectorAll('.menu-item, .nav-item')
  
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault()
      const routeName = item.getAttribute('data-route')
      
      if (routeName && routeName !== 'add') {
        // Update active state
        updateActiveMenuItem(routeName)
        
        // Navigate to route
        router.push(`/${routeName}`)
      }
    })
  })
}

// Setup quick add functionality
const setupQuickAdd = () => {
  const quickAddBtn = document.getElementById('quick-add-btn')
  const quickAddModal = document.getElementById('quick-add-modal')
  const closeQuickAdd = document.getElementById('close-quick-add')
  const quickOptions = document.querySelectorAll('.quick-option')
  
  if (quickAddBtn && quickAddModal) {
    quickAddBtn.addEventListener('click', (e) => {
      e.preventDefault()
      quickAddModal.classList.add('show')
    })
  }
  
  if (closeQuickAdd && quickAddModal) {
    closeQuickAdd.addEventListener('click', () => {
      quickAddModal.classList.remove('show')
    })
    
    // Close on backdrop click
    quickAddModal.addEventListener('click', (e) => {
      if (e.target === quickAddModal) {
        quickAddModal.classList.remove('show')
      }
    })
  }
  
  // Handle quick options
  quickOptions.forEach(option => {
    option.addEventListener('click', () => {
      const type = option.getAttribute('data-type')
      
      // Show transaction form instead of navigating
      if (type) {
        showQuickTransactionForm(type)
      }
    })
  })
  
  // Setup transaction form handlers
  setupQuickTransactionForm()
}

// Show quick transaction form
const showQuickTransactionForm = (type: string) => {
  const quickOptions = document.getElementById('quick-add-options')
  const transactionForm = document.getElementById('quick-transaction-form')
  const modalTitle = document.getElementById('quick-modal-title')
  const typeSelect = document.getElementById('quick-transaction-type') as HTMLSelectElement
  const dateInput = document.getElementById('quick-transaction-date') as HTMLInputElement
  
  if (quickOptions && transactionForm && modalTitle && typeSelect && dateInput) {
    // Hide options, show form
    quickOptions.style.display = 'none'
    transactionForm.style.display = 'block'
    
    // Update title and pre-select type
    modalTitle.textContent = type === 'income' ? 'Tambah Pemasukan' : 'Tambah Pengeluaran'
    typeSelect.value = type
    
    // Set default date to today
    dateInput.value = new Date().toISOString().split('T')[0]
    
    // Load accounts and categories
    loadQuickFormData(type)
  }
}

// Setup quick transaction form handlers
const setupQuickTransactionForm = () => {
  const backBtn = document.getElementById('back-to-quick-options')
  const form = document.getElementById('quick-transaction-form')
  const quickOptions = document.getElementById('quick-add-options')
  const modalTitle = document.getElementById('quick-modal-title')
  
  // Back button handler
  if (backBtn && quickOptions && form && modalTitle) {
    backBtn.addEventListener('click', () => {
      form.style.display = 'none'
      quickOptions.style.display = 'block'
      modalTitle.textContent = 'Tambah Cepat'
      
      // Reset form
      if (form instanceof HTMLFormElement) {
        form.reset()
      }
    })
  }
  
  // Form submit handler
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await handleQuickTransactionSubmit()
    })
  }
}

// Load accounts and categories for quick form
const loadQuickFormData = async (type: string) => {
  const categorySelect = document.getElementById('quick-transaction-category') as HTMLSelectElement
  const accountSelect = document.getElementById('quick-transaction-account') as HTMLSelectElement
  
  if (!categorySelect || !accountSelect || !authStore.user?.family_id) return
  
  try {
    // Import transaction store dynamically
    const { useTransactionStore } = await import('@/stores/transaction')
    const transactionStore = useTransactionStore()
    
    // Load data if not already loaded
    await Promise.all([
      transactionStore.loadAccounts(authStore.user.family_id),
      transactionStore.loadCategories(authStore.user.family_id)
    ])
    
    // Populate accounts
    accountSelect.innerHTML = '<option value="">Pilih akun</option>'
    transactionStore.accounts.forEach(account => {
      const option = document.createElement('option')
      option.value = account.id
      option.textContent = account.name
      accountSelect.appendChild(option)
    })
    
    // Populate categories based on type
    categorySelect.innerHTML = '<option value="">Pilih kategori</option>'
    const categories = type === 'income' ? transactionStore.incomeCategories : transactionStore.expenseCategories
    categories.forEach(category => {
      const option = document.createElement('option')
      option.value = category.id
      option.textContent = category.name
      categorySelect.appendChild(option)
    })
  } catch (error) {
    console.error('Failed to load form data:', error)
  }
}

// Handle quick transaction form submission
const handleQuickTransactionSubmit = async () => {
  const form = document.getElementById('quick-transaction-form') as HTMLFormElement
  if (!form) return
  
  const transactionData = {
    type: (document.getElementById('quick-transaction-type') as HTMLSelectElement).value,
    amount: parseInt((document.getElementById('quick-transaction-amount') as HTMLInputElement).value),
    category_id: (document.getElementById('quick-transaction-category') as HTMLSelectElement).value,
    account_id: (document.getElementById('quick-transaction-account') as HTMLSelectElement).value,
    date: (document.getElementById('quick-transaction-date') as HTMLInputElement).value,
    description: (document.getElementById('quick-transaction-description') as HTMLTextAreaElement).value,
    family_id: authStore.user?.family_id
  }
  
  try {
    // Import transaction store dynamically
    const { useTransactionStore } = await import('@/stores/transaction')
    const transactionStore = useTransactionStore()
    
    // Save transaction using createTransaction method
    if (authStore.user?.family_id && authStore.user?.id) {
      await transactionStore.createTransaction(authStore.user.family_id, authStore.user.id, transactionData)
    }
    
    // Close modal and reset form
    const quickAddModal = document.getElementById('quick-add-modal')
    const quickOptions = document.getElementById('quick-add-options')
    const modalTitle = document.getElementById('quick-modal-title')
    
    if (quickAddModal && quickOptions && modalTitle) {
      quickAddModal.classList.remove('show')
      form.style.display = 'none'
      quickOptions.style.display = 'block'
      modalTitle.textContent = 'Tambah Cepat'
      form.reset()
    }
    
    // Show success message (optional)
    console.log('Transaction added successfully!')
  } catch (error) {
    console.error('Failed to add transaction:', error)
    alert('Gagal menambahkan transaksi. Silakan coba lagi.')
  }
}

// Setup logout
const setupLogout = () => {
  const logoutBtn = document.getElementById('logout-btn')
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      
      const success = await authStore.logout()
      if (success) {
        router.push('/auth/login')
      }
    })
  }
}

// Update user information
const updateUserInfo = () => {
  if (!authStore.user) return
  
  const userNameEl = document.getElementById('user-name')
  const userEmailEl = document.getElementById('user-email')
  const userAvatarEl = document.getElementById('user-avatar')
  
  if (userNameEl) {
    userNameEl.textContent = authStore.user.full_name
  }
  
  if (userEmailEl) {
    userEmailEl.textContent = authStore.user.email
  }
  
  if (userAvatarEl) {
    // Set user initials
    const initials = authStore.user.full_name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
    
    userAvatarEl.innerHTML = `<span>${initials}</span>`
  }
}

// Update active menu item
const updateActiveMenuItem = (routeName: string) => {
  // Remove active class from all items
  const allItems = document.querySelectorAll('.menu-item, .nav-item')
  allItems.forEach(item => {
    item.classList.remove('active')
  })
  
  // Add active class to current items
  const activeItems = document.querySelectorAll(`[data-route="${routeName}"]`)
  activeItems.forEach(item => {
    item.classList.add('active')
  })
}

// Update active route based on current route
const updateActiveRoute = () => {
  const routeName = route.name as string
  if (routeName) {
    updateActiveMenuItem(routeName)
  }
}

// Watch for route changes
router.afterEach((to) => {
  if (to.name) {
    setTimeout(() => {
      updateActiveMenuItem(to.name as string)
    }, 100)
  }
})

// Props for slot content
defineProps<{
  pageTitle?: string
}>()
</script>

<template>
  <div>
    <!-- Load external CSS -->
    <link rel="stylesheet" href="/src/styles/layout.css">
    
    <!-- HTML Template -->
    <div v-html="template"></div>
    
    <!-- Slot for page content -->
    <div class="page-content-slot">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-content-slot {
  /* This will be positioned in the main content area */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
}

@media (min-width: 768px) {
  .page-content-slot {
    left: 256px; /* Width of sidebar */
  }
}
</style>