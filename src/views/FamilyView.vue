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
    const response = await fetch('/src/templates/family.html')
    template.value = await response.text()
    
    // Initialize after template loads
    setTimeout(() => {
      initializeFamily()
    }, 100)
  } catch (error) {
    console.error('Failed to load family template:', error)
  }
})
  
  // Load HTML template dan data keluarga
  import { familyService } from '@/services/family'
  import { supabase } from '@/services/supabase'
  
  onMounted(async () => {
    try {
      const response = await fetch('/src/templates/family.html')
      template.value = await response.text()
  
      // Setelah template load, ambil data keluarga user
      setTimeout(async () => {
        await loadFamilyData()
        initializeFamily()
      }, 100)
    } catch (error) {
      console.error('Failed to load family template:', error)
    }
  })
  
  // Ambil dan tampilkan kode keluarga user & anggota keluarga
  async function loadFamilyData() {
    try {
      // Pastikan user sudah login dan punya family_id
      const user = authStore.user
      if (!user || !user.family_id) return
      // Ambil data keluarga
      const res = await familyService.getFamily(user.family_id)
      if (res.data && res.data.family_code) {
        const codeEl = document.getElementById('family-code')
        if (codeEl) codeEl.textContent = res.data.family_code
        // Untuk modal undang anggota
        const inviteCodeInput = document.getElementById('invite-family-code') as HTMLInputElement
        if (inviteCodeInput) inviteCodeInput.value = res.data.family_code
      }
      // Ambil anggota keluarga
      const membersRes = await familyService.getFamilyMembers(user.family_id)
      if (membersRes.data && Array.isArray(membersRes.data)) {
        const membersList = document.getElementById('family-members-list')
        if (membersList) {
          membersList.innerHTML = ''
          membersRes.data.forEach(member => {
            const div = document.createElement('div')
            div.className = 'member-item'
            div.innerHTML = `<span>${member.user?.full_name || member.user_id}</span> <span class="role">${member.role === 'owner' ? '👑 Pemilik' : 'Anggota'}</span>`
            membersList.appendChild(div)
          })
        }
      }
    } catch (e) {
      console.error('Gagal mengambil data keluarga/anggota:', e)
    }
  }
  
  // ...existing code...

// Initialize family page
import { familyService } from '@/services/family'
import { supabase } from '@/services/supabase'

const initializeFamily = () => {
  // Handler buat keluarga
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

  // Handler buka modal undang anggota
  const inviteBtn = document.getElementById('invite-member-btn')
  const inviteModal = document.getElementById('invite-modal')
  const closeInviteBtn = document.getElementById('close-invite-modal')
  if (inviteBtn && inviteModal) {
    inviteBtn.addEventListener('click', () => {
      inviteModal.classList.add('show')
    })
  }
  if (closeInviteBtn && inviteModal) {
    closeInviteBtn.addEventListener('click', () => {
      inviteModal.classList.remove('show')
    })
  }

  // Handler salin kode undangan
  const copyInviteBtn = document.getElementById('copy-invite-code')
  const inviteCodeInput = document.getElementById('invite-family-code') as HTMLInputElement
  if (copyInviteBtn && inviteCodeInput) {
    copyInviteBtn.addEventListener('click', () => {
      inviteCodeInput.select()
      document.execCommand('copy')
      copyInviteBtn.textContent = 'Disalin!'
      setTimeout(() => { copyInviteBtn.textContent = 'Salin' }, 1200)
    })
  }

  // Handler share WhatsApp
  const shareWA = document.getElementById('share-whatsapp')
  if (shareWA && inviteCodeInput) {
    shareWA.addEventListener('click', () => {
      const text = `Ayo gabung keluarga di Cuanify! Kode keluarga: ${inviteCodeInput.value}`
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`)
    })
  }
  // Handler share Email
  const shareEmail = document.getElementById('share-email')
  if (shareEmail && inviteCodeInput) {
    shareEmail.addEventListener('click', () => {
      const subject = 'Undangan Bergabung Keluarga di Cuanify'
      const body = `Ayo gabung keluarga di Cuanify! Kode keluarga: ${inviteCodeInput.value}`
      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
    })
  }
  // Handler share Copy Link
  const shareCopy = document.getElementById('share-copy')
  if (shareCopy && inviteCodeInput) {
    shareCopy.addEventListener('click', () => {
      const url = window.location.origin + '/register?invite=' + inviteCodeInput.value
      navigator.clipboard.writeText(url)
      shareCopy.textContent = 'Link Disalin!'
      setTimeout(() => { shareCopy.textContent = 'Salin Link' }, 1200)
    })
  }
}
</script>

<template>
  <AppLayout page-title="Keluarga">
    <!-- Load external CSS -->
    <link rel="stylesheet" href="/src/styles/family.css">
    
    <!-- HTML Template -->
    <div v-html="template"></div>
  </AppLayout>
</template>