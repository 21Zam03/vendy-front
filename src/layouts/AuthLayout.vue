<script setup>
import { LayoutGrid, Palette, MessageCircle } from '@lucide/vue'
import Logo from '@/components/ui/Logo.vue'

defineProps({
  showSocialProof: { type: Boolean, default: true },
})

const highlights = [
  { icon: LayoutGrid, text: 'Agrega tus productos y organízalos por categorías' },
  { icon: Palette, text: 'Personaliza el diseño con colores, tipografías y plantillas' },
  { icon: MessageCircle, text: 'Publícalo con un link y recibe pedidos por WhatsApp' },
]
</script>

<template>
  <div class="grid min-h-screen grid-cols-1 lg:grid-cols-2">
    <div class="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:p-12">
      <div
        class="pointer-events-none absolute inset-0"
        style="background: radial-gradient(60% 50% at 15% 10%, rgba(108,79,255,0.5), transparent), radial-gradient(50% 40% at 90% 90%, rgba(37,211,102,0.25), transparent)"
      />
      <div class="relative z-10">
        <div class="flex items-center gap-2">
          <img src="/favicon.svg" width="30" height="30" alt="Vendy" />
          <span class="text-lg font-semibold text-white">Vendy</span>
        </div>
      </div>

      <div class="relative z-10 flex flex-1 items-center justify-center">
        <div class="max-w-md">
          <div v-if="$slots.illustration" class="mb-8">
            <slot name="illustration" />
          </div>
          <p class="text-3xl font-semibold leading-tight text-white">
            Tu catálogo online, listo en minutos.
          </p>
          <div class="mt-10 flex flex-col gap-4">
            <div v-for="h in highlights" :key="h.text" class="flex items-center gap-3 text-slate-300">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <component :is="h.icon" class="size-[18px] text-white" />
              </span>
              <span class="text-sm">{{ h.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showSocialProof" class="relative z-10 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div class="flex -space-x-2">
          <span class="flex size-8 items-center justify-center rounded-full border-2 border-slate-950 bg-brand-500 text-xs font-semibold text-white">CR</span>
          <span class="flex size-8 items-center justify-center rounded-full border-2 border-slate-950 bg-whatsapp-500 text-xs font-semibold text-white">DS</span>
          <span class="flex size-8 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-500 text-xs font-semibold text-white">LJ</span>
        </div>
        <p class="text-xs text-slate-300">
          <span class="font-semibold text-white">+3.200 negocios</span> ya tienen su catálogo en Vendy
        </p>
      </div>
    </div>

    <div class="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
      <div class="mb-10 lg:hidden">
        <Logo />
      </div>
      <div class="w-full max-w-sm mx-auto lg:mx-0">
        <slot />
      </div>
    </div>
  </div>
</template>
