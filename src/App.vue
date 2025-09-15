<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Initialize app
onMounted(async () => {
  // Check if user is already authenticated
  await authStore.getCurrentUser()
})
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
/* Global app styles are in main.css */
#app {
  min-height: 100vh;
}
</style>