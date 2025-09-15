import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Auth Views
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import EmailConfirmView from '@/views/EmailConfirmView.vue'

// Main App Views
import DashboardView from '@/views/DashboardView.vue'
import TransactionsView from '@/views/TransactionsView.vue'
import FamilyView from '@/views/FamilyView.vue'
import FamilySetupView from '@/views/FamilySetupView.vue'
import AccountsView from '@/views/AccountsView.vue'
import ReportsView from '@/views/ReportsView.vue'
import SettingsView from '@/views/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    // Auth routes
    {
      path: '/auth',
      children: [
        {
          path: 'login',
          name: 'login',
          component: LoginView,
          meta: { requiresAuth: false }
        },
        {
          path: 'register', 
          name: 'register',
          component: RegisterView,
          meta: { requiresAuth: false }
        },
        {
          path: 'confirm',
          name: 'email-confirm',
          component: EmailConfirmView,
          meta: { requiresAuth: false }
        }
      ]
    },
    // Main app routes
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: TransactionsView,
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/accounts',
      name: 'accounts',
      component: AccountsView,
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/family',
      children: [
        {
          path: '',
          name: 'family',
          component: FamilyView,
          meta: { requiresAuth: true, requiresFamily: true }
        },
        {
          path: 'setup',
          name: 'family-setup',
          component: FamilySetupView,
          meta: { requiresAuth: true, requiresFamily: false }
        }
      ]
    },
    {
      path: '/reports',
      name: 'reports', 
      component: ReportsView,
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true, requiresFamily: true }
    },
    // Catch all route
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth state if not already done
  if (!authStore.user && !authStore.isLoading) {
    await authStore.getCurrentUser()
  }
  
  const requiresAuth = to.meta.requiresAuth
  const requiresFamily = to.meta.requiresFamily
  const isAuthenticated = authStore.isAuthenticated
  const hasFamily = authStore.hasFamily
  
  // Check authentication
  if (requiresAuth && !isAuthenticated) {
    next('/auth/login')
    return
  }
  
  // Redirect authenticated users away from auth pages
  if (!requiresAuth && isAuthenticated) {
    if (hasFamily) {
      next('/dashboard')
    } else {
      next('/family/setup')
    }
    return
  }
  
  // Check family requirement
  if (requiresFamily && isAuthenticated && !hasFamily) {
    next('/family/setup')
    return
  }
  
  // Allow navigation
  next()
})

export default router