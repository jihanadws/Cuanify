<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'

// Template and stores
const template = ref('')
const authStore = useAuthStore()
const router = useRouter()

// Load HTML template
onMounted(async () => {
  try {
  const response = await fetch('/family.html')
    template.value = await response.text()
    
    // Initialize after template loads
    setTimeout(() => {
      initializeFamily()
    }, 100)
  } catch (error) {
    console.error('Failed to load family template:', error)
  }
})

// Initialize family page
import { familyService } from '@/services/family'
import { supabase } from '@/services/supabase'

const initializeFamily = () => {
  console.log('Initializing family page...')
  // Contoh: event handler untuk tombol buat keluarga
  const createBtn = document.getElementById('create-family-btn')
  if (createBtn) {
    createBtn.addEventListener('click', async () => {
      const familyNameInput = document.getElementById('family-name-input') as HTMLInputElement
      const familyName = familyNameInput?.value?.trim()
      if (!familyName) {
        alert('Nama keluarga wajib diisi')
        return
      }
      // Ambil user id dari session Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('User belum login, silakan login ulang')
        return
      }
      const result = await familyService.createFamily(user.id, familyName)
      if (result.error) {
        alert(result.error)
      } else {
        alert('Keluarga berhasil dibuat!')
        window.location.reload()
      }
    })
  }
}
</script>

<template>
  <AppLayout page-title="Keluarga">
    <!-- Load external CSS -->
  <!-- CSS sudah diimport di main.ts, tidak perlu <link> manual -->
    
    <!-- HTML Template -->
    <div v-html="template"></div>
  </AppLayout>
</template>