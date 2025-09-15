import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth'
import type { AuthUser, LoginCredentials, RegisterCredentials } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const hasFamily = computed(() => !!user.value?.family_id)
  const userRole = computed(() => user.value?.role)

  // Actions
  async function register(credentials: RegisterCredentials) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.register(credentials)
      
      if (response.error) {
        error.value = response.error
        return false
      }

      user.value = response.data
      return true
    } catch (err) {
      error.value = 'Terjadi kesalahan saat mendaftar'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function login(credentials: LoginCredentials) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.login(credentials)
      
      if (response.error) {
        error.value = response.error
        return false
      }

      user.value = response.data
      return true
    } catch (err) {
      error.value = 'Terjadi kesalahan saat masuk'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.logout()
      
      if (response.error) {
        error.value = response.error
        return false
      }

      user.value = null
      return true
    } catch (err) {
      error.value = 'Terjadi kesalahan saat keluar'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function getCurrentUser() {
    isLoading.value = true
    
    try {
      const currentUser = await authService.getCurrentUser()
      user.value = currentUser
    } catch (err) {
      console.error('Error getting current user:', err)
      user.value = null
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(updates: Partial<{ full_name: string }>) {
    if (!user.value) return false

    isLoading.value = true
    error.value = null

    try {
      const response = await authService.updateProfile(user.value.id, updates)
      
      if (response.error) {
        error.value = response.error
        return false
      }

      user.value = response.data
      return true
    } catch (err) {
      error.value = 'Terjadi kesalahan saat update profil'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function resetPassword(email: string) {
    isLoading.value = true
    error.value = null

    try {
      const response = await authService.resetPassword(email)
      
      if (response.error) {
        error.value = response.error
        return false
      }

      return true
    } catch (err) {
      error.value = 'Terjadi kesalahan saat reset password'
      return false
    } finally {
      isLoading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    hasFamily,
    userRole,
    
    // Actions
    register,
    login,
    logout,
    getCurrentUser,
    updateProfile,
    resetPassword,
    clearError
  }
})