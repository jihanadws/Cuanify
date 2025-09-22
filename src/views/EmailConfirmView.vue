<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/services/supabase'

const router = useRouter()

// Helper to load HTML template
async function loadTemplate(path: string) {
  const res = await fetch(path)
  return await res.text()
}

onMounted(async () => {
  // Load the HTML template
  const container = document.getElementById('email-confirm-root')
  if (!container) return
  const html = await loadTemplate('/email_confirm.html')
  container.innerHTML = html

  // Start with loading state
  const statusDiv = container.querySelector('.confirm-status') as HTMLElement
  const messageP = container.querySelector('.confirm-message') as HTMLElement
  const successDiv = container.querySelector('.success-icon') as HTMLElement
  const errorDiv = container.querySelector('.error-icon') as HTMLElement
  const goLoginBtn = container.querySelector('.go-login') as HTMLElement

  // Hide all states initially
  statusDiv.style.display = 'none'
  successDiv.style.display = 'none'
  errorDiv.style.display = 'none'
  if (goLoginBtn) goLoginBtn.style.display = 'none'

  try {
    // Handle the auth callback
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error

    // Show status
    statusDiv.style.display = 'block'
    messageP.style.display = 'none'

    if (data.session) {
      // Success
      successDiv.style.display = 'flex'
      errorDiv.style.display = 'none'
      if (goLoginBtn) goLoginBtn.style.display = 'none'
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } else {
      // Error
      successDiv.style.display = 'none'
      errorDiv.style.display = 'flex'
      if (goLoginBtn) goLoginBtn.style.display = 'inline-block'
    }
  } catch (err) {
    // Error
    statusDiv.style.display = 'block'
    successDiv.style.display = 'none'
    errorDiv.style.display = 'flex'
    if (goLoginBtn) goLoginBtn.style.display = 'inline-block'
  }

  // Button event
  if (goLoginBtn) {
    goLoginBtn.addEventListener('click', () => {
      router.push('/auth/login')
    })
  }
})
</script>

<template>
  <div id="email-confirm-root"></div>
</template>