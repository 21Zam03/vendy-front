<script setup>
import { MessageCircle, CheckCircle2 } from '@lucide/vue'
</script>

<template>
  <div class="relative mx-auto flex h-64 w-full max-w-[17rem] items-center justify-center">
    <!-- resplandor ambiental -->
    <div class="absolute size-48 rounded-full bg-brand-500/25 blur-3xl" />

    <!-- sombra de piso -->
    <div class="absolute bottom-3 h-4 w-28 rounded-full bg-black/40 blur-md" />

    <!-- teléfono con el catálogo -->
    <div class="relative -rotate-6 rounded-[2rem] border border-white/15 bg-gradient-to-b from-slate-800 to-slate-900 p-2 shadow-2xl shadow-black/40">
      <div class="flex h-44 w-28 flex-col gap-2 rounded-[1.5rem] bg-slate-950/70 p-2.5">
        <div class="flex items-center justify-between px-0.5">
          <span class="h-1.5 w-8 rounded-full bg-white/25" />
          <span class="flex gap-0.5">
            <span class="size-0.5 rounded-full bg-white/25" />
            <span class="size-0.5 rounded-full bg-white/25" />
            <span class="size-0.5 rounded-full bg-white/25" />
          </span>
        </div>
        <div class="grid flex-1 grid-cols-2 gap-1.5">
          <div class="flex flex-col gap-1 rounded-lg bg-gradient-to-br from-brand-400/60 to-brand-600/60 p-1">
            <div class="flex-1 rounded-md bg-white/10" />
            <span class="h-1 w-4/5 rounded-full bg-white/40" />
          </div>
          <div class="flex flex-col gap-1 rounded-lg bg-gradient-to-br from-whatsapp-400/50 to-whatsapp-600/60 p-1">
            <div class="flex-1 rounded-md bg-white/10" />
            <span class="h-1 w-4/5 rounded-full bg-white/40" />
          </div>
          <div class="flex flex-col gap-1 rounded-lg bg-gradient-to-br from-sky-400/50 to-sky-600/50 p-1">
            <div class="flex-1 rounded-md bg-white/10" />
            <span class="h-1 w-4/5 rounded-full bg-white/40" />
          </div>
          <div class="flex flex-col gap-1 rounded-lg bg-gradient-to-br from-amber-400/50 to-amber-600/50 p-1">
            <div class="flex-1 rounded-md bg-white/10" />
            <span class="h-1 w-4/5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>

    <!-- producto flotante -->
    <div class="absolute left-1 top-4 flex -rotate-6 items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 shadow-lg shadow-black/30 backdrop-blur">
      <span class="size-3.5 shrink-0 rounded bg-gradient-to-br from-brand-300 to-brand-500" />
      <span class="text-[11px] font-medium text-white">S/ 89</span>
    </div>

    <!-- burbuja de whatsapp -->
    <div class="absolute right-2 top-10 flex size-11 rotate-6 items-center justify-center rounded-2xl bg-whatsapp-500 shadow-lg shadow-whatsapp-500/40">
      <MessageCircle class="size-5 text-white" />
    </div>

    <!-- venta confirmada -->
    <div class="absolute bottom-8 right-0 flex size-10 -rotate-6 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-brand-500/40">
      <CheckCircle2 class="size-5 text-white" />
    </div>
  </div>
</template>
