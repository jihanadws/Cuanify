<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { LoginCredentials } from '@/types'

// Template loading
const template = ref('')
const authStore = useAuthStore()
const router = useRouter()

// Form state
const form = ref<LoginCredentials>({
  email: '',
  password: ''
})

const showPassword = ref(false)

// Load HTML template
onMounted(async () => {
  try {
    const response = await fetch('/src/templates/login.html')
    template.value = await response.text()
  } catch (error) {
    console.error('Failed to load login template:', error)
  }
})

// Watch for template changes and setup event listeners
watch(template, async (newTemplate) => {
  if (newTemplate) {
    await nextTick()
    handleTemplateReady()
  }
})

// Form methods
const handleSubmit = async (event: Event) => {
  event.preventDefault()
  
  if (!form.value.email || !form.value.password) {
    return
  }

  const success = await authStore.login(form.value)
  
  if (success) {
    // Redirect based on family status
    if (authStore.hasFamily) {
      router.push('/dashboard')
    } else {
      router.push('/family/setup')
    }
  }
}

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const goToRegister = () => {
  router.push('/auth/register')
}

// Update form values when DOM is ready
const updateFormValues = () => {
  const emailInput = document.getElementById('email') as HTMLInputElement
  const passwordInput = document.getElementById('password') as HTMLInputElement
  
  if (emailInput && passwordInput) {
    emailInput.value = form.value.email
    passwordInput.value = form.value.password
    
    emailInput.addEventListener('input', (e) => {
      form.value.email = (e.target as HTMLInputElement).value
    })
    
    passwordInput.addEventListener('input', (e) => {
      form.value.password = (e.target as HTMLInputElement).value
    })
  }
}

// Handle template events
const handleTemplateReady = () => {
  updateFormValues()
  
  const formElement = document.querySelector('.auth-form')
  const registerLink = document.querySelector('.link')
  
  if (formElement) {
    formElement.addEventListener('submit', handleSubmit)
  }
  
  if (registerLink) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault()
      goToRegister()
    })
  }
}
</script>

<template>
  <div>
    <!-- Load external CSS -->
    <link rel="stylesheet" href="/src/styles/auth.css">
    
    <!-- Display error if any -->
    <div v-if="authStore.error" class="error-message">
      {{ authStore.error }}
      <button @click="authStore.clearError">&times;</button>
    </div>
    
    <!-- Loading state -->
    <div v-if="authStore.isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Sedang masuk...</p>
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