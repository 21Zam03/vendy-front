<script setup>
import { ref } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import { useBusiness } from '@/composables/useBusiness'

const sidebarOpen = ref(false)

const { ensureInitialized } = useBusiness()
ensureInitialized()
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex min-w-0 flex-1 flex-col">
      <Header @toggle-sidebar="sidebarOpen = true" />
      <main class="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
