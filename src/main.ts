import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useTransactionStore } from '@/stores/transaction'

// Import global styles
import './styles/main.css'
import './styles/accounts.css'
import './styles/auth.css'
import './styles/dashboard.css'
import './styles/email_confirm.css'
import './styles/family.css'
import './styles/layout.css'
import './styles/transactions.css'

// Create Vue app
const app = createApp(App)

// Use plugins
app.use(createPinia())
app.use(router)

// Initialize offline sync after app is created
app.mount('#app')

// Initialize offline functionality
const transactionStore = useTransactionStore()
transactionStore.initializeOfflineSync().catch(console.error)