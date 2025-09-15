import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useTransactionStore } from '@/stores/transaction'

// Import global styles
import './styles/main.css'

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