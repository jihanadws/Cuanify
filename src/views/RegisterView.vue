<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RegisterCredentials } from '@/types'

// Template loading
const template = ref('')
const authStore = useAuthStore()
const router = useRouter()

// Form state
const form = ref<RegisterCredentials>({
  full_name: '',
  email: '',
  password: '',
})

const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Load HTML template
onMounted(async () => {
  try {
  const response = await fetch('/register.html')
    template.value = await response.text()
  } catch (error) {
    console.error('Failed to load register template:', error)
  }
})

// Watch for template changes and setup event listeners
watch(template, async (newTemplate) => {
  if (newTemplate) {
    await nextTick()
    handleTemplateReady()
  }
})

// Form validation
const isPasswordMatch = () => {
  return form.value.password === confirmPassword.value
}

const isFormValid = () => {
  return form.value.full_name.trim() !== '' &&
         form.value.email.trim() !== '' &&
         form.value.password.length >= 8 &&
         isPasswordMatch()
}

// Form methods
const handleSubmit = async (event: Event) => {
  event.preventDefault()
  
  if (!isFormValid()) {
    return
  }

  const success = await authStore.register(form.value)
  
  if (success) {
    // After successful registration, redirect to family setup
    router.push('/family/setup')
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

const goToLogin = () => {
  router.push('/auth/login')
}

// Update form values when DOM is ready
const updateFormValues = () => {
  const fullNameInput = document.getElementById('fullName') as HTMLInputElement
  const emailInput = document.getElementById('email') as HTMLInputElement
  const passwordInput = document.getElementById('password') as HTMLInputElement
  const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement
  
  if (fullNameInput && emailInput && passwordInput && confirmPasswordInput) {
    fullNameInput.value = form.value.full_name
    emailInput.value = form.value.email
    passwordInput.value = form.value.password
    confirmPasswordInput.value = confirmPassword.value
    
    fullNameInput.addEventListener('input', (e) => {
      form.value.full_name = (e.target as HTMLInputElement).value
    })
    
    emailInput.addEventListener('input', (e) => {
      form.value.email = (e.target as HTMLInputElement).value
    })
    
    passwordInput.addEventListener('input', (e) => {
      form.value.password = (e.target as HTMLInputElement).value
    })
    
    confirmPasswordInput.addEventListener('input', (e) => {
      confirmPassword.value = (e.target as HTMLInputElement).value
    })
  }
}

// Handle template events
const handleTemplateReady = () => {
  updateFormValues()
  
  const formElement = document.querySelector('.auth-form')
  const loginLink = document.querySelector('.link')
  
  if (formElement) {
    formElement.addEventListener('submit', handleSubmit)
  }
  
  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault()
      goToLogin()
    })
  }
}
</script>

<template>
  <div>
    <!-- Load external CSS -->
  <!-- CSS sudah diimport di main.ts, tidak perlu <link> manual -->
    
    <!-- Display error if any -->
    <div v-if="authStore.error" class="error-message">
      {{ authStore.error }}
      <button @click="authStore.clearError">&times;</button>
    </div>
    
    <!-- Display validation errors -->
    <div v-if="!isPasswordMatch() && confirmPassword" class="error-message">
      Konfirmasi password tidak sesuai
    </div>
    
    <!-- Loading state -->
    <div v-if="authStore.isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Sedang mendaftar...</p>
    </div>
    
    <!-- HTML Template -->
    <div 
      v-html="template"
    ></div>
  </div>
</template>

<style scoped>
.error-message {
  @apply fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 flex items-center space-x-2;
}

.error-message button {
  @apply text-red-700 hover:text-red-900 ml-2 font-bold;
}

.loading-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50;
}

.loading-spinner {
  @apply w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-4;
}

.loading-overlay p {
  @apply text-white text-lg;
}
</style>