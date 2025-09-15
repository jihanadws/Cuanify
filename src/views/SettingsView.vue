<script setup lang="ts">
import { ref } from 'vue'
import AppLayout from '@/components/AppLayout.vue'

const placeholder = ref('Halaman Pengaturan akan dikembangkan selanjutnya')
</script>

<template>
  <AppLayout page-title="Pengaturan">
    <div class="placeholder-container">
      <div class="placeholder-content">
        <h2>Pengaturan</h2>
        <p>{{ placeholder }}</p>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.placeholder-container {
  @apply flex items-center justify-center h-64;
}

.placeholder-content {
  @apply text-center space-y-4;
}

.placeholder-content h2 {
  @apply text-2xl font-bold text-gray-900;
}

.placeholder-content p {
  @apply text-gray-600;
}
</style>