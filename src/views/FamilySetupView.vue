<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { familyService } from '@/services/family'

// Template and stores
const template = ref('')
const authStore = useAuthStore()
const router = useRouter()

// Form state
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'create' | 'join'>('create')

// Form data
const createForm = ref({
  familyName: ''
})

const joinForm = ref({
  familyCode: ''
})

// Load HTML template
onMounted(async () => {
  try {
    // For now, create a simple setup template
    template.value = `
      <div class="family-setup-container">
        <div class="setup-card">
          <div class="setup-header">
            <h1>Pengaturan Keluarga</h1>
            <p>Buat keluarga baru atau bergabung dengan keluarga yang sudah ada</p>
          </div>
          
          <div class="tab-buttons">
            <button class="tab-btn active" data-tab="create">Buat Keluarga Baru</button>
            <button class="tab-btn" data-tab="join">Bergabung dengan Keluarga</button>
          </div>
          
          <div class="tab-content">
            <div class="tab-pane active" id="create-tab">
              <form class="setup-form" id="create-form">
                <div class="form-group">
                  <label for="family-name">Nama Keluarga</label>
                  <input type="text" id="family-name" placeholder="Masukkan nama keluarga Anda" required>
                </div>
                <button type="submit" class="btn-primary">Buat Keluarga</button>
              </form>
            </div>
            
            <div class="tab-pane" id="join-tab">
              <form class="setup-form" id="join-form">
                <div class="form-group">
                  <label for="family-code">Kode Keluarga</label>
                  <input type="text" id="family-code" placeholder="Masukkan kode keluarga (contoh: ABC-123-XYZ)" required>
                </div>
                <button type="submit" class="btn-primary">Bergabung</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `
    
    setTimeout(() => {
      initializeSetup()
    }, 100)
  } catch (error) {
    console.error('Failed to load family setup template:', error)
  }
})

// Initialize setup functionality
const initializeSetup = () => {
  setupTabs()
  setupForms()
}

// Setup tabs
const setupTabs = () => {
  const tabButtons = document.querySelectorAll('.tab-btn')
  const tabPanes = document.querySelectorAll('.tab-pane')

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.getAttribute('data-tab')
      
      // Update active tab
      tabButtons.forEach(btn => btn.classList.remove('active'))
      tabPanes.forEach(pane => pane.classList.remove('active'))
      
      button.classList.add('active')
      const targetPane = document.getElementById(`${tab}-tab`)
      if (targetPane) {
        targetPane.classList.add('active')
      }
      
      activeTab.value = tab as 'create' | 'join'
    })
  })
}

// Setup forms
const setupForms = () => {
  const createFormEl = document.getElementById('create-form')
  const joinFormEl = document.getElementById('join-form')
  
  if (createFormEl) {
    createFormEl.addEventListener('submit', handleCreateFamily)
  }
  
  if (joinFormEl) {
    joinFormEl.addEventListener('submit', handleJoinFamily)
  }
}

// Handle create family
const handleCreateFamily = async (event: Event) => {
  event.preventDefault()

  console.log('=== DEBUG: Memulai proses buat keluarga ===')
  
  // Import supabase at the top for better consistency
  const { supabase } = await import('@/services/supabase')
  
  // Debug: Cek session Supabase
  const { data: { user }, error: sessionError } = await supabase.auth.getUser()
  console.log('DEBUG: Session user:', user)
  console.log('DEBUG: Session error:', sessionError)
  console.log('DEBUG: authStore.user:', authStore.user)
  
  if (!user) {
    console.error('DEBUG: User tidak ditemukan di session')
    error.value = 'Session tidak valid. Silakan logout dan login ulang.'
    return
  }

  const familyNameInput = document.getElementById('family-name') as HTMLInputElement
  const familyName = familyNameInput?.value.trim()

  if (!familyName) {
    error.value = 'Nama keluarga tidak boleh kosong'
    return
  }

  console.log('DEBUG: Nama keluarga:', familyName)
  console.log('DEBUG: User ID yang akan digunakan:', user.id)

  // Debug: Cek apakah user ada di tabel users
  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()
  
  console.log('DEBUG: User profile di tabel users:', userProfile)
  console.log('DEBUG: User profile error:', userError)
  
  if (!userProfile) {
    console.error('DEBUG: User tidak ditemukan di tabel users')
    error.value = 'Profile user tidak ditemukan. Silakan logout dan login ulang.'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    // Debug: Cek data yang akan dikirim
    const payload = {
      name: familyName,
      created_by: user.id // Pastikan ini string UUID yang valid
    }
    console.log('=== FINAL DEBUG ATTEMPT ===')
    console.log('Payload:', payload)
    console.log('User ID type:', typeof user.id)
    console.log('User ID value:', user.id)
    
    // Test insert langsung dengan error detail maksimal
    const { data: familyData, error: familyError } = await supabase
      .from('families')
      .insert(payload)
      .select('*')
      .single()
    
    console.log('INSERT RESULT:', familyData)
    console.log('INSERT ERROR FULL:', JSON.stringify(familyError, null, 2))
    
    if (familyError) {
      // Log every possible error detail
      console.error('ERROR CODE:', familyError.code)
      console.error('ERROR MESSAGE:', familyError.message)
      console.error('ERROR DETAILS:', familyError.details)
      console.error('ERROR HINT:', familyError.hint)
      
      // Show specific error to user
      if (familyError.code === '42501') {
        error.value = `RLS Policy Error: ${familyError.message}. Cek logs untuk detail.`
      } else {
        error.value = `Database Error [${familyError.code}]: ${familyError.message}`
      }
      return
    }
    
    if (familyData) {
      console.log('SUCCESS: Family created:', familyData)
      
      // Add creator as owner to family_members
      const memberPayload = {
        user_id: user.id,
        family_id: familyData.id,
        role: 'owner'
      }
      
      console.log('Adding family member:', memberPayload)
      
      const { error: memberError } = await supabase
        .from('family_members')
        .insert(memberPayload)
      
      if (memberError) {
        console.error('Member creation error:', memberError)
        // Clean up family if member creation fails
        await supabase.from('families').delete().eq('id', familyData.id)
        error.value = `Gagal menambahkan anggota keluarga: ${memberError.message}`
        return
      }
      
      // Refresh user data to get family info
      await authStore.getCurrentUser()
      
      // Redirect to dashboard
      router.push('/dashboard')
      return
    }
  } catch (err) {
    console.error('DEBUG: Error di catch block:', err)
    error.value = 'Terjadi kesalahan saat membuat keluarga'
  } finally {
    isLoading.value = false
  }
}

// Handle join family
const handleJoinFamily = async (event: Event) => {
  event.preventDefault()
  
  if (!authStore.user) return
  
  const familyCodeInput = document.getElementById('family-code') as HTMLInputElement
  const familyCode = familyCodeInput?.value.trim()
  
  if (!familyCode) {
    error.value = 'Kode keluarga tidak boleh kosong'
    return
  }
  
  isLoading.value = true
  error.value = null
  
  try {
    const response = await familyService.joinFamily(authStore.user.id, familyCode)
    
    if (response.error) {
      error.value = response.error
      return
    }
    
    // Refresh user data to get family info
    await authStore.getCurrentUser()
    
    // Redirect to dashboard
    router.push('/dashboard')
  } catch (err) {
    error.value = 'Terjadi kesalahan saat bergabung dengan keluarga'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Load external CSS -->
  <!-- CSS sudah diimport di main.ts, tidak perlu <link> manual -->
    
    <!-- Display error if any -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="error = null">&times;</button>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>{{ activeTab === 'create' ? 'Membuat keluarga...' : 'Bergabung dengan keluarga...' }}</p>
    </div>
    
    <!-- HTML Template -->
    <div v-html="template"></div>
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

/* Setup specific styles */
:deep(.family-setup-container) {
  @apply min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4;
}

:deep(.setup-card) {
  @apply bg-white rounded-2xl shadow-xl p-8 w-full max-w-md;
}

:deep(.setup-header) {
  @apply text-center mb-8;
}

:deep(.setup-header h1) {
  @apply text-2xl font-bold text-gray-900 mb-2;
}

:deep(.setup-header p) {
  @apply text-gray-600;
}

:deep(.tab-buttons) {
  @apply flex mb-6 bg-gray-100 rounded-lg p-1;
}

:deep(.tab-btn) {
  @apply flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors;
}

:deep(.tab-btn.active) {
  @apply bg-white text-blue-600 shadow-sm;
}

:deep(.tab-pane) {
  @apply hidden;
}

:deep(.tab-pane.active) {
  @apply block;
}

:deep(.setup-form) {
  @apply space-y-6;
}

:deep(.form-group) {
  @apply space-y-2;
}

:deep(.form-group label) {
  @apply block text-sm font-medium text-gray-700;
}

:deep(.form-group input) {
  @apply w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors;
}

:deep(.btn-primary) {
  @apply w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
</style>