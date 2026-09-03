<script setup>
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { useAuth } from '@/composables/useAuth'

const { state, ensureInitialized } = useAuth()
ensureInitialized()
</script>

<template>
  <div v-if="state.initializing" class="flex min-h-screen items-center justify-center bg-white">
    <div class="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
  </div>
  <template v-else>
    <router-view />
    <ToastContainer />
  </template>
</template>
