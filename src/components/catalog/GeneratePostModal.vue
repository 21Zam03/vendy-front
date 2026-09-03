<script setup>
import { computed, ref, watch } from 'vue'
import { Check, Copy } from '@lucide/vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { copyToClipboard } from '@/utils/share'
import { useToast } from '@/composables/useToast'

const { error: toastError } = useToast()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  variants: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const activeKey = ref(props.variants[0]?.key)
const copied = ref(false)

watch(
  () => props.variants,
  (variants) => {
    activeKey.value = variants[0]?.key
    copied.value = false
  },
)

const activeText = computed(() => props.variants.find((v) => v.key === activeKey.value)?.text ?? '')

async function copy() {
  const ok = await copyToClipboard(activeText.value)
  if (ok) {
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } else {
    toastError('No se pudo copiar', { description: 'Selecciona el texto manualmente y cópialo' })
  }
}
</script>

<template>
  <BaseModal
    :model-value="modelValue"
    size="lg"
    title="Generar publicación"
    description="Cópialo y pégalo en Instagram, Facebook o tu estado de WhatsApp."
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="variants.length > 1" class="mb-3 flex flex-wrap gap-1.5">
      <button
        v-for="v in variants"
        :key="v.key"
        class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
        :class="activeKey === v.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
        @click="activeKey = v.key"
      >
        {{ v.label }}
      </button>
    </div>

    <textarea
      :value="activeText"
      rows="8"
      class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      readonly
    />

    <div class="mt-4 flex justify-end">
      <BaseButton @click="copy">
        <Check v-if="copied" class="size-4" />
        <Copy v-else class="size-4" />
        {{ copied ? 'Copiado' : 'Copiar texto' }}
      </BaseButton>
    </div>
  </BaseModal>
</template>
