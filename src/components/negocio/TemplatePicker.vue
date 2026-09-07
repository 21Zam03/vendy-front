<script setup>
import { Check, LayoutGrid, Rows3, Lock } from '@lucide/vue'
import { templateOptions } from '@/data/templates'

const props = defineProps({
  selected: { type: String, default: null },
  // Plan Gratis: solo "Catálogo general" es elegible — el resto de las plantillas se
  // muestran igual (para que sepa que existen) pero bloqueadas, con un aviso en vez de
  // aplicarlas. El backend igual las rechaza si se intenta de otra forma (ver
  // NegocioService.guardar), esto es solo la señal visual.
  locked: { type: Boolean, default: false },
})

const emit = defineEmits(['pick', 'locked'])

function pickTemplate(key) {
  if (props.locked) {
    emit('locked')
    return
  }
  emit('pick', key)
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <!-- Catálogo general: el estilo con el que arranca toda cuenta nueva (sin plantilla
         decorativa) — se puede volver a elegir para sacarse cualquier plantilla de encima.
         Siempre disponible, sin importar el plan. -->
    <div
      class="flex flex-col overflow-hidden rounded-2xl border-2 transition-colors"
      :class="!selected ? 'border-brand-500' : 'border-slate-200 hover:border-slate-300'"
    >
      <div class="relative flex h-28 flex-col items-center justify-center gap-1 bg-gradient-to-br from-slate-300 to-slate-500">
        <LayoutGrid class="size-9 text-white" />
        <span
          v-if="!selected"
          class="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow"
        >
          <Check class="size-3.5" />
        </span>
      </div>

      <div class="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p class="text-sm font-semibold text-slate-900">Catálogo general</p>
          <p class="mt-0.5 text-xs leading-relaxed text-slate-400">
            Grilla simple con todos tus productos, sin estilo decorativo. El punto de partida de toda cuenta nueva.
          </p>
        </div>

        <button
          type="button"
          class="mt-auto flex h-9 items-center justify-center rounded-lg text-xs font-semibold transition-colors"
          :class="!selected ? 'bg-brand-50 text-brand-700' : 'bg-slate-900 text-white hover:bg-slate-800'"
          @click="pickTemplate(null)"
        >
          {{ !selected ? 'Estilo actual' : 'Usar catálogo general' }}
        </button>
      </div>
    </div>

    <div
      v-for="t in templateOptions"
      :key="t.key"
      class="flex flex-col overflow-hidden rounded-2xl border-2 transition-colors"
      :class="[
        selected === t.key ? 'border-brand-500' : 'border-slate-200 hover:border-slate-300',
        locked ? 'opacity-60' : '',
      ]"
    >
      <div class="relative flex h-28 flex-col items-center justify-center gap-1 text-4xl" :class="t.previewGradient">
        <span>{{ t.emoji }}</span>
        <span
          v-if="selected === t.key"
          class="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-white/90 text-brand-600 shadow"
        >
          <Check class="size-3.5" />
        </span>
        <span
          v-else-if="locked"
          class="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow"
        >
          <Lock class="size-3.5" />
        </span>
      </div>

      <div class="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p class="text-sm font-semibold text-slate-900">{{ t.label }}</p>
          <p class="mt-0.5 text-xs leading-relaxed text-slate-400">{{ t.description }}</p>
        </div>

        <div v-if="t.sectionPresets?.length" class="flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
          <Rows3 class="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <span>
            <span class="font-medium text-slate-700">{{ t.sectionPresets.length }} secciones</span>
            sugeridas: {{ t.sectionPresets.join(', ') }}
          </span>
        </div>

        <button
          type="button"
          class="mt-auto flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors"
          :class="
            selected === t.key
              ? 'bg-brand-50 text-brand-700'
              : locked
                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                : 'bg-slate-900 text-white hover:bg-slate-800'
          "
          @click="pickTemplate(t.key)"
        >
          <Lock v-if="locked && selected !== t.key" class="size-3.5" />
          {{ selected === t.key ? 'Plantilla actual' : locked ? 'Requiere plan Go' : 'Usar esta plantilla' }}
        </button>
      </div>
    </div>
  </div>
</template>
